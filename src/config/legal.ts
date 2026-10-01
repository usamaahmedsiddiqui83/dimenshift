import { brand, contactDetails } from './site';

/**
 * CLIENT: complete these before launch, and have both documents reviewed by a qualified legal
 * adviser for the places you operate in. Null values are simply left out of the pages.
 */
export const legalEntity = {
  /** Registered legal name of the business, if it differs from the brand name. */
  name: brand.name as string,
  /** Registered business address. */
  address: null as string | null,
  /** Governing law for the terms, e.g. "England and Wales" or "the State of California". */
  jurisdiction: null as string | null,
  /** Email for privacy and legal requests; defaults to the site contact email. */
  email: contactDetails.email,
};

/** A paragraph, a bulleted list, or the business's contact details. */
export type LegalBlock = string | { list: string[] } | { contact: true };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  lastUpdated: string;
  lastUpdatedIso: string;
  sections: LegalSection[];
}

const updated = { lastUpdated: '17 September 2026', lastUpdatedIso: '2026-09-17' };
const entity = legalEntity.name;

/**
 * Written to match what the website actually does: no analytics or advertising cookies, a project
 * intake form (with file uploads) as the only way personal information is collected, and the
 * Satoshi typeface loaded from Fontshare. Update it if any of that changes.
 */
export const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  intro: `How ${entity} collects, uses and protects personal information when you visit this website or send us a project request.`,
  ...updated,
  sections: [
    {
      id: 'who-we-are',
      title: 'Who we are',
      blocks: [
        `${entity} (“we”, “us”, “our”) provides mechanical product design and 3D CAD engineering services. This policy explains what personal information we collect through this website, why we collect it, and the choices and rights you have.`,
      ],
    },
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      blocks: [
        'When you send a project request through our intake form, we collect the information you choose to give us:',
        {
          list: [
            'Your full name and email address.',
            'Optionally, your company name.',
            'Details of your project: project type, the service you need, a project description, your timeline and any additional message.',
            'Files you upload, such as drawings, CAD models, documents and images (PDF, DWG, DXF, STEP, IGES, STL, ZIP, PNG, JPG and WEBP).',
          ],
        },
        'Like any website, the servers that deliver these pages also receive standard technical information with each request, such as your IP address, browser type and the pages requested.',
      ],
    },
    {
      id: 'how-we-use-information',
      title: 'How we use your information',
      blocks: [
        'We use the information you provide to:',
        {
          list: [
            'Respond to your enquiry and discuss your project.',
            'Assess the engineering work involved and prepare a quote or proposal.',
            'Carry out and support the services you engage us for.',
            'Protect the website and intake form against spam and misuse.',
            'Meet our legal, accounting and record-keeping obligations.',
          ],
        },
        'We do not sell your personal information, and we do not use it for advertising.',
      ],
    },
    {
      id: 'your-files',
      title: 'Your files and project information',
      blocks: [
        'Files and project details you share with us are treated as confidential. They are used only to understand, quote and carry out your project, and are made available only to the people who need them for that purpose.',
        'Please upload only material you have the right to share.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and tracking',
      blocks: [
        'This website does not use analytics or advertising cookies, and it does not track you across other websites. If that changes, we will update this policy before introducing them.',
      ],
    },
    {
      id: 'third-parties',
      title: 'Third-party services',
      blocks: [
        {
          list: [
            'Fonts: this website loads the Satoshi typeface from Fontshare. To deliver the font files, your browser connects to Fontshare’s servers, which receive your IP address.',
            'Hosting and form handling: the provider that hosts this website and the service that receives project requests process information on our behalf, solely to operate the website and deliver your request to us.',
          ],
        },
      ],
    },
    {
      id: 'retention',
      title: 'How long we keep information',
      blocks: [
        'We keep project requests and files only for as long as we need them for the purposes above — for example, while we discuss, quote or carry out your project — and for as long as the law requires us to keep business records. Information we no longer need is securely deleted.',
      ],
    },
    {
      id: 'security',
      title: 'Security',
      blocks: [
        'We use reasonable technical and organisational measures to protect personal information and uploaded files against loss, misuse and unauthorised access. No method of sending or storing data over the internet is completely secure, so we cannot guarantee absolute security.',
      ],
    },
    {
      id: 'your-rights',
      title: 'Your rights',
      blocks: [
        'Depending on where you live, you may have the right to:',
        {
          list: [
            'Access the personal information we hold about you.',
            'Ask us to correct information that is inaccurate or incomplete.',
            'Ask us to delete your information.',
            'Object to, or ask us to restrict, how we use your information.',
            'Receive your information in a portable format.',
          ],
        },
        'You may also have the right to complain to your local data protection authority. To make a request, contact us using the details below.',
      ],
    },
    {
      id: 'children',
      title: 'Children',
      blocks: [
        'Our services are intended for businesses and adults. This website is not directed at children, and we do not knowingly collect personal information from them.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      blocks: [
        'We may update this policy from time to time. The date at the top of this page shows when it was last changed.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact us',
      blocks: ['For questions about this policy or your personal information:', { contact: true }],
    },
  ],
};

export const termsAndConditions: LegalDocument = {
  title: 'Terms & Conditions',
  intro: `The terms that apply when you use this website and send ${entity} a project request.`,
  ...updated,
  sections: [
    {
      id: 'about-these-terms',
      title: 'About these terms',
      blocks: [
        `This website is operated by ${entity} (“we”, “us”, “our”). By using it, you agree to these terms. If you do not agree, please do not use the website.`,
      ],
    },
    {
      id: 'using-the-website',
      title: 'Using the website',
      blocks: [
        'You may use this website for lawful purposes only. You agree not to:',
        {
          list: [
            'Attempt to gain unauthorised access to the website, its servers or connected systems.',
            'Upload or transmit malware, or any content that is unlawful, harmful or infringes the rights of others.',
            'Disrupt the website or interfere with other visitors’ use of it.',
            'Submit false information or requests on behalf of someone else without their permission.',
            'Copy or scrape content from the website by automated means.',
          ],
        },
      ],
    },
    {
      id: 'website-information',
      title: 'Information on this website',
      blocks: [
        'The information on this website describes our services in general terms. Illustrative studies and visuals demonstrate typical engineering approaches and are not records of specific client projects unless stated.',
        'Figures such as tolerances and turnaround times describe our typical capability; what applies to your project is confirmed in its written proposal. We aim to keep information accurate and up to date, but it may change without notice and does not form a binding offer.',
      ],
    },
    {
      id: 'project-requests',
      title: 'Project requests and quotations',
      blocks: [
        'Sending a project request does not create a contract or oblige either party to proceed. Any quote we provide is an estimate based on the information available, valid for the period stated in it.',
        'An engagement begins only when a written proposal or agreement has been accepted by both parties. That agreement sets out the scope, fees, timeline, deliverables, confidentiality and ownership of work for the project, and takes precedence over these terms.',
      ],
    },
    {
      id: 'uploaded-files',
      title: 'Files you upload',
      blocks: [
        'By uploading files, you confirm that you have the right to share them with us. You keep ownership of your files, and you permit us to use them only to review your request, prepare a quote and discuss your project. We treat them as confidential, as described in our Privacy Policy.',
      ],
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual property',
      blocks: [
        `The content of this website — including text, graphics, the ${brand.name} name and logo, visuals, animations and code — is owned by or licensed to ${entity}. You may view it for your own reference, but you may not copy, reproduce or reuse it without our written permission.`,
        'Ownership of the models, drawings and other deliverables we create for a project is set out in the written agreement for that project.',
      ],
    },
    {
      id: 'third-party-links',
      title: 'Links to other websites',
      blocks: [
        'This website may link to websites run by others. We do not control those websites and are not responsible for their content or practices.',
      ],
    },
    {
      id: 'disclaimer',
      title: 'Disclaimer',
      blocks: [
        'This website is provided “as is” and “as available”. To the extent permitted by law, we make no warranties that it will be uninterrupted, error-free or free of harmful components.',
      ],
    },
    {
      id: 'liability',
      title: 'Limitation of liability',
      blocks: [
        'To the extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of this website or reliance on its content. Our responsibilities for engineering services are set out in the written agreement for each project.',
        'Nothing in these terms limits or excludes any liability that cannot be limited or excluded by law.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      blocks: [
        'We may update these terms from time to time. The date at the top of this page shows when they were last changed, and continuing to use the website after a change means you accept the updated terms.',
      ],
    },
    {
      id: 'governing-law',
      title: 'Governing law',
      blocks: [
        legalEntity.jurisdiction
          ? `These terms are governed by the laws of ${legalEntity.jurisdiction}, and the courts of ${legalEntity.jurisdiction} have jurisdiction over any dispute arising from them.`
          : `These terms are governed by the laws of the place where ${entity} is established, and any dispute arising from them will be handled by the courts there, unless the law where you live requires otherwise.`,
      ],
    },
    {
      id: 'contact',
      title: 'Contact us',
      blocks: ['For questions about these terms:', { contact: true }],
    },
  ],
};
