import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const Legal = () => {
  const { theme } = useTheme();

  const sectionClass = `border rounded-lg p-5 mb-6 ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-gray-100'
      : 'bg-gray-100 border-gray-200 text-gray-900'
  }`;

  const headingClass = 'text-base font-semibold uppercase tracking-wide mb-3 text-blue-500';

  return (
    <>
      <h1 className="text-4xl font-extrabold mb-2 text-center">Legal Notice</h1>
      <p className={`text-center mb-8 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Service-CMS — Copyright &amp; Attribution
      </p>

      <div className={sectionClass}>
        <h2 className={headingClass}>Copyright</h2>
        <p className="leading-relaxed">
          Service-CMS (including derivatives ServiceCMS, Server-CMS, and ServerCMS)<br />
          Copyright 2026, Jan-Alban Rathjen (also known as &apos;Jay Rathjen&apos;),<br />
          acting in the name of the Service-CMS Project Authors.
        </p>
        <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Project Website (Temporary):{' '}
          <a
            href="https://pluracon.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            https://pluracon.org
          </a>
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Project Stewardship &amp; Governance</h2>
        <p className="leading-relaxed mb-3">
          Jan-Alban Rathjen (&quot;Jay Rathjen&quot;) serves as the Founding Steward and Project
          Lead of the Service-CMS Project. The Steward maintains the exclusive right to manage
          project assets, including the authority to transfer all copyrights, trademarks, and
          management responsibilities to a non-profit foundation or a successor legal entity at
          their sole discretion.
        </p>
        <p className="leading-relaxed">
          The Steward is committed to transferring the Service-CMS trademarks and names to a
          neutral, independent legal entity once the project has sufficiently organized itself to
          ensure long-term sustainability, vendor neutrality, and equitable distribution of rights
          among contributors.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Attribution Requirements</h2>
        <p className="leading-relaxed mb-3">
          Pursuant to Section 4(d) of the Apache License 2.0, any derivative work or redistribution
          of this software MUST retain this NOTICE file. If the software is used in a web-hosted
          environment, a visible link to the contributor list (e.g., via /info/legal) must be
          maintained.
        </p>
        <p className="font-medium mb-2">Core Contributors:</p>
        <ul className={`list-disc list-inside space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <li>Mira Weitner</li>
          <li>Jay Rathjen</li>
        </ul>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Permissions &amp; Scope</h2>
        <ol className={`list-decimal list-inside space-y-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <li>
            <span className="font-medium text-inherit">Modification &amp; Commercial Use:</span>{' '}
            As per the Apache 2.0 License, users are permitted to modify, bundle, and resell this
            software.
          </li>
          <li>
            <span className="font-medium text-inherit">Plugins &amp; Interfaces:</span>{' '}
            Software that links to this Work via established interfaces or APIs is considered
            separable and is not subject to the terms of this License as a Derivative Work.
          </li>
          <li>
            <span className="font-medium text-inherit">Trademark:</span>{' '}
            The names &ldquo;Service-CMS&rdquo; and derivatives remain trademarks of the Project
            Steward until the formal transfer to a legal entity.
          </li>
        </ol>
      </div>

      <p className={`text-xs text-center mt-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
        Licensed under the Apache License, Version 2.0
      </p>
    </>
  );
};

export default Legal;
