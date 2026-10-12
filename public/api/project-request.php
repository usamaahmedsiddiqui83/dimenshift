<?php
/**
 * Project intake endpoint (Hostinger shared hosting, PHP 8).
 *
 * Receives the contact form as multipart/form-data (see src/lib/api/projectRequest.ts), re-validates
 * every field and file, saves the request and its files outside the web root, and emails it to
 * RECIPIENT with the files attached (or listed, when they are too large for email). Mail goes through
 * authenticated SMTP when intake-config.php has credentials (see smtpConfig), else PHP mail().
 *
 * Responds with JSON: { "reference": "DS-XXXXXX" } on success, { "error": "..." } otherwise.
 */

declare(strict_types=1);

const RECIPIENT = 'contact@dimenshift.com';
const SENDER = 'noreply@dimenshift.com';
const SENDER_NAME = 'DIMENSHIFT Website';

const MAX_FILES = 10;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
/** Above this, files stay on the server and are listed in the email instead of attached. */
const MAX_ATTACH_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'dwg', 'dxf', 'step', 'stp', 'stl', 'iges', 'igs', 'zip', 'png', 'jpg', 'jpeg', 'webp'];

const PROJECT_TYPES = [
    'New product development',
    'Redesign of an existing product',
    'Prototype to production',
    'Documentation for an existing design',
    'Legacy part or CAD conversion',
    'Other',
];
const SERVICES = [
    'mechanical-product-design' => 'Mechanical Product Design',
    '3d-cad-modeling' => '3D CAD Modeling',
    'engineering-drawings' => 'Engineering Drawings',
    'design-for-manufacturing' => 'Design for Manufacturing (DFM)',
    'product-development' => 'Product Development',
    'cad-conversion-reverse-engineering' => 'CAD Conversion & Reverse Engineering',
    'design-optimization' => 'Design Optimization',
    'not-sure' => 'Not sure yet',
];
const TIMELINES = ['As soon as possible', 'Within 1 month', '1–3 months', '3–6 months', 'Not yet defined'];

/** Per-IP limit: at most RATE_LIMIT requests per RATE_WINDOW seconds. */
const RATE_LIMIT = 5;
const RATE_WINDOW = 3600;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header_remove('X-Powered-By'); // don't advertise the PHP version

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Private storage outside public_html (…/domains/dimenshift.com/intake-requests). */
function storageDir(): string
{
    $dir = dirname(__DIR__, 2) . '/intake-requests';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        // Fallback inside the web root, locked down so nothing in it can be fetched.
        $dir = __DIR__ . '/.intake-requests';
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
            @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
        }
    }
    return $dir;
}

/**
 * SMTP credentials live outside public_html in …/domains/dimenshift.com/intake-config.php, which
 * returns ['host' => …, 'port' => 465, 'user' => 'contact@dimenshift.com', 'pass' => '…'].
 * Without a password there, mail goes out through PHP mail() instead.
 */
function smtpConfig(): ?array
{
    $file = dirname(__DIR__, 2) . '/intake-config.php';
    if (!is_file($file)) return null;
    $cfg = include $file;
    if (!is_array($cfg) || empty($cfg['user']) || empty($cfg['pass'])) return null;
    return [
        'host' => (string) ($cfg['host'] ?? 'smtp.hostinger.com'),
        'port' => (int) ($cfg['port'] ?? 465),
        'user' => (string) $cfg['user'],
        'pass' => (string) $cfg['pass'],
    ];
}

/** Sends one message over implicit-TLS SMTP with AUTH LOGIN. Returns null on success, or the error. */
function smtpSend(array $cfg, string $from, string $to, string $message): ?string
{
    $socket = @stream_socket_client('ssl://' . $cfg['host'] . ':' . $cfg['port'], $errno, $errstr, 20);
    if (!$socket) return "connect failed: $errstr ($errno)";
    stream_set_timeout($socket, 30);

    $read = function () use ($socket): string {
        $response = '';
        while (($line = fgets($socket, 1024)) !== false) {
            $response .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $response;
    };
    $command = function (?string $line, string $expect) use ($socket, $read): ?string {
        if ($line !== null) {
            // TLS streams may accept only part of a large write, so keep writing until all is sent.
            $buffer = $line . "\r\n";
            while ($buffer !== '') {
                $written = fwrite($socket, $buffer);
                if ($written === false || $written === 0) return 'write failed';
                $buffer = substr($buffer, $written);
            }
        }
        $response = $read();
        if (str_starts_with($response, $expect)) return null;
        return trim($response) !== '' ? trim($response) : 'no response';
    };

    // Lines starting with "." are doubled so they are not read as the end of the message.
    $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r", "\n"], ["\n", "\n", "\r\n"], $message));
    // [label for the log, line to send, expected reply code]. Labels keep credentials out of the log.
    $steps = [
        ['greeting', null, '220'],
        ['EHLO', 'EHLO dimenshift.com', '250'],
        ['AUTH', 'AUTH LOGIN', '334'],
        ['username', base64_encode($cfg['user']), '334'],
        ['password', base64_encode($cfg['pass']), '235'],
        ['MAIL FROM', "MAIL FROM:<$from>", '250'],
        ['RCPT TO', "RCPT TO:<$to>", '250'],
        ['DATA', 'DATA', '354'],
        ['message', $data . "\r\n.", '250'],
    ];
    foreach ($steps as [$label, $line, $expect]) {
        $error = $command($line, $expect);
        if ($error !== null) {
            fclose($socket);
            return "$label: $error";
        }
    }
    fwrite($socket, "QUIT\r\n");
    fclose($socket);
    return null;
}

function rateLimited(string $storage): bool
{
    $dir = $storage . '/.rate';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $now = time();
    $hits = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
    $hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
    if (count($hits) >= RATE_LIMIT) return true;
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return false;
}

function field(string $name): string
{
    $value = $_POST[$name] ?? '';
    return is_string($value) ? trim(str_replace("\0", '', $value)) : '';
}

/** Header-safe single line. */
function oneLine(string $s): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $s) ?? '');
}

function encodeHeader(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

function formatBytes(int $bytes): string
{
    return $bytes >= 1048576 ? sprintf('%.1f MB', $bytes / 1048576) : max(1, (int) round($bytes / 1024)) . ' KB';
}

function safeFilename(string $name): string
{
    $name = basename(str_replace('\\', '/', $name));
    $name = preg_replace('/[^A-Za-z0-9._ -]+/', '_', $name) ?? 'file';
    $name = ltrim($name, '.');
    return substr($name !== '' ? $name : 'file', -120);
}

// ── Request checks ────────────────────────────────────────────────────────────

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Method not allowed.']);
}

// Browsers always send Origin on cross-site POSTs: refuse submissions made from other websites.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ['https://dimenshift.com', 'https://www.dimenshift.com'], true)) {
    respond(403, ['error' => 'Forbidden.']);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && empty($_POST) && empty($_FILES)) {
    respond(413, ['error' => 'The upload is too large.']);
}

$storage = storageDir();
if (rateLimited($storage)) {
    respond(429, ['error' => 'Too many requests. Please try again later.']);
}

// Honeypot: the site never sends this field, so anything here is a bot.
if (field('website') !== '') {
    respond(200, ['reference' => 'DS-' . strtoupper(substr(base_convert((string) time(), 10, 36), -6))]);
}

// ── Fields ────────────────────────────────────────────────────────────────────

$f = [
    'fullName' => oneLine(field('fullName')),
    'company' => oneLine(field('company')),
    'email' => oneLine(field('email')),
    'projectType' => field('projectType'),
    'service' => field('service'),
    'description' => field('description'),
    'timeline' => field('timeline'),
    'message' => field('message'),
];

$errors = [];
$len = fn(string $s) => mb_strlen($s, 'UTF-8');
if ($f['fullName'] === '' || $len($f['fullName']) > 120) $errors[] = 'fullName';
if ($len($f['company']) > 160) $errors[] = 'company';
if (!filter_var($f['email'], FILTER_VALIDATE_EMAIL) || $len($f['email']) > 254) $errors[] = 'email';
if (!in_array($f['projectType'], PROJECT_TYPES, true)) $errors[] = 'projectType';
if (!array_key_exists($f['service'], SERVICES)) $errors[] = 'service';
if ($len($f['description']) < 30 || $len($f['description']) > 5000) $errors[] = 'description';
if ($f['timeline'] !== '' && !in_array($f['timeline'], TIMELINES, true)) $errors[] = 'timeline';
if ($len($f['message']) > 3000) $errors[] = 'message';

// ── Files ─────────────────────────────────────────────────────────────────────

$uploads = [];
if (isset($_FILES['files']) && is_array($_FILES['files']['name'] ?? null)) {
    foreach ($_FILES['files']['name'] as $i => $name) {
        $uploads[] = [
            'name' => (string) $name,
            'tmp' => (string) $_FILES['files']['tmp_name'][$i],
            'size' => (int) $_FILES['files']['size'][$i],
            'error' => (int) $_FILES['files']['error'][$i],
        ];
    }
} elseif (isset($_FILES['files']['name'])) {
    $uploads[] = [
        'name' => (string) $_FILES['files']['name'],
        'tmp' => (string) $_FILES['files']['tmp_name'],
        'size' => (int) $_FILES['files']['size'],
        'error' => (int) $_FILES['files']['error'],
    ];
}

$uploads = array_values(array_filter($uploads, fn($u) => $u['error'] !== UPLOAD_ERR_NO_FILE));
if (count($uploads) > MAX_FILES) $errors[] = 'files';

$totalBytes = 0;
foreach ($uploads as $u) {
    if (in_array($u['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        respond(413, ['error' => 'A file is too large.']);
    }
    $ext = strtolower(pathinfo($u['name'], PATHINFO_EXTENSION));
    if (
        $u['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($u['tmp']) || $u['size'] <= 0
        || $u['size'] > MAX_FILE_BYTES || !in_array($ext, ALLOWED_EXTENSIONS, true)
    ) {
        $errors[] = 'files';
        break;
    }
    $totalBytes += $u['size'];
}
if ($totalBytes > MAX_TOTAL_BYTES) $errors[] = 'files';

if ($errors) {
    respond(400, ['error' => 'Some fields are invalid.', 'fields' => array_values(array_unique($errors))]);
}

// ── Save the request privately ────────────────────────────────────────────────

$reference = 'DS-' . strtoupper(bin2hex(random_bytes(3)));
$requestDir = $storage . '/' . gmdate('Y-m-d_His') . '_' . $reference;
@mkdir($requestDir, 0700, true);

$saved = [];
foreach ($uploads as $u) {
    $name = safeFilename($u['name']);
    $target = $requestDir . '/' . $name;
    for ($n = 2; file_exists($target); $n++) {
        $target = $requestDir . '/' . pathinfo($name, PATHINFO_FILENAME) . "-$n." . pathinfo($name, PATHINFO_EXTENSION);
    }
    if (!move_uploaded_file($u['tmp'], $target)) {
        respond(500, ['error' => 'The files could not be saved.']);
    }
    @chmod($target, 0600);
    $saved[] = ['name' => basename($target), 'path' => $target, 'size' => $u['size']];
}

$sentAt = gmdate('D, d M Y H:i') . ' UTC';
$record = $f + [
    'reference' => $reference,
    'serviceLabel' => SERVICES[$f['service']],
    'files' => array_map(fn($s) => ['name' => $s['name'], 'size' => $s['size']], $saved),
    'receivedAt' => gmdate('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'userAgent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
];
@file_put_contents($requestDir . '/request.json', json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

// ── Compose the email ─────────────────────────────────────────────────────────

$attach = $totalBytes > 0 && $totalBytes <= MAX_ATTACH_BYTES;
$rows = [
    'Reference' => $reference,
    'Name' => $f['fullName'],
    'Company' => $f['company'] !== '' ? $f['company'] : '—',
    'Email' => $f['email'],
    'Project type' => $f['projectType'],
    'Service' => SERVICES[$f['service']],
    'Timeline' => $f['timeline'] !== '' ? $f['timeline'] : '—',
    'Received' => $sentAt,
];
$fileLines = array_map(fn($s) => $s['name'] . ' (' . formatBytes($s['size']) . ')', $saved);
$fileNote = !$saved
    ? 'No files attached.'
    : ($attach
        ? 'Attached to this email.'
        : 'Too large to attach (' . formatBytes($totalBytes) . ' in total). They are saved on the server in hPanel → File Manager → '
            . basename(dirname($requestDir)) . '/' . basename($requestDir) . '.');

// Plain text
$text = "New project request from the DIMENSHIFT website\n\n";
foreach ($rows as $k => $v) $text .= str_pad($k . ':', 14) . $v . "\n";
$text .= "\nProject description\n-------------------\n" . $f['description'] . "\n";
if ($f['message'] !== '') $text .= "\nAdditional message\n------------------\n" . $f['message'] . "\n";
$text .= "\nFiles\n-----\n" . ($fileLines ? implode("\n", $fileLines) . "\n" : '') . $fileNote . "\n";
$text .= "\nReply to this email to answer " . $f['fullName'] . " directly.\n";

// HTML
$h = fn(string $s) => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$tableRows = '';
foreach ($rows as $k => $v) {
    $value = $k === 'Email' ? '<a href="mailto:' . $h($v) . '" style="color:#1d5bd6">' . $h($v) . '</a>' : $h($v);
    $tableRows .= '<tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">' . $h($k)
        . '</td><td style="padding:6px 0;color:#0b1220">' . $value . '</td></tr>';
}
$section = fn(string $title, string $body) => '<h3 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#1d5bd6">'
    . $h($title) . '</h3><div style="white-space:pre-wrap;line-height:1.55;color:#0b1220">' . $body . '</div>';
$html = '<!doctype html><html><body style="margin:0;background:#f3f5f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px">'
    . '<div style="max-width:640px;margin:0 auto;padding:24px">'
    . '<div style="background:#0b1430;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">'
    . '<div style="font-size:12px;letter-spacing:.12em;color:#8fb0ff">DIMENSHIFT · NEW PROJECT REQUEST</div>'
    . '<div style="font-size:20px;font-weight:600;margin-top:6px">' . $h($f['fullName']) . ($f['company'] !== '' ? ' · ' . $h($f['company']) : '') . '</div></div>'
    . '<div style="background:#fff;padding:20px 24px 28px;border-radius:0 0 10px 10px">'
    . '<table style="border-collapse:collapse;font-size:14px">' . $tableRows . '</table>'
    . $section('Project description', $h($f['description']))
    . ($f['message'] !== '' ? $section('Additional message', $h($f['message'])) : '')
    . $section('Files', ($fileLines ? $h(implode("\n", $fileLines)) . "\n" : '') . '<span style="color:#6b7280">' . $h($fileNote) . '</span>')
    . '<p style="margin:28px 0 0;color:#6b7280;font-size:13px">Reply to this email to answer ' . $h($f['fullName']) . ' directly.</p>'
    . '</div></div></body></html>';

$mixed = 'mixed_' . bin2hex(random_bytes(12));
$alt = 'alt_' . bin2hex(random_bytes(12));

$body = "This is a multi-part message in MIME format.\r\n\r\n"
    . "--$mixed\r\nContent-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n"
    . "--$alt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($text)) . "\r\n"
    . "--$alt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($html)) . "\r\n"
    . "--$alt--\r\n";

if ($attach) {
    foreach ($saved as $s) {
        $data = file_get_contents($s['path']);
        if ($data === false) continue;
        $quoted = addcslashes($s['name'], '"\\');
        $body .= "\r\n--$mixed\r\nContent-Type: application/octet-stream; name=\"$quoted\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$quoted\"\r\n\r\n"
            . chunk_split(base64_encode($data));
    }
}
$body .= "\r\n--$mixed--\r\n";

$subject = 'New project request ' . $reference . ' — ' . $f['fullName'] . ($f['company'] !== '' ? ' (' . $f['company'] . ')' : '');
$smtp = smtpConfig();
$from = $smtp ? $smtp['user'] : SENDER;
$headers = [
    'From: ' . encodeHeader(SENDER_NAME) . ' <' . $from . '>',
    'Reply-To: ' . encodeHeader($f['fullName']) . ' <' . $f['email'] . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $mixed . '"',
    'X-Mailer: DIMENSHIFT intake',
];

if ($smtp) {
    // Authenticated SMTP: Hostinger DKIM-signs the message for dimenshift.com, so it passes DMARC.
    $message = implode("\r\n", array_merge([
        'Date: ' . date('r'),
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>',
        'To: <' . RECIPIENT . '>',
        'Subject: ' . encodeHeader($subject),
    ], $headers)) . "\r\n\r\n" . $body;
    $error = smtpSend($smtp, $from, RECIPIENT, $message);
    $sent = $error === null;
    if (!$sent) {
        // Fall back to the server's local mailer so the request still arrives (possibly as spam).
        $sent = mail(RECIPIENT, encodeHeader($subject), $body, implode("\r\n", $headers), '-f' . $from);
        $error = 'SMTP: ' . $error . ($sent ? ' (delivered via mail() instead)' : '');
    }
} else {
    $error = null;
    $sent = mail(RECIPIENT, encodeHeader($subject), $body, implode("\r\n", $headers), '-f' . SENDER);
}
@file_put_contents(
    $requestDir . '/mail-status.txt',
    ($sent ? 'sent' : 'FAILED') . ' ' . gmdate('c') . ($error ? ' ' . $error : '') . ($smtp ? ' [smtp]' : ' [mail()]') . "\n",
    FILE_APPEND,
);

// The request and its files are saved either way, so the sender is not asked to resubmit.
respond(200, ['reference' => $reference]);
