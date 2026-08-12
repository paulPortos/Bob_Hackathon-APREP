'use client';

import { ReactNode, useState } from 'react';
import {
  AlertTriangle,
  Database,
  ExternalLink,
  FileText,
  Lock,
  Scale,
  Share2,
  UserRoundCheck,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy';
}

function LegalSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Scale;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function TermsAndPrivacyModal({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}: TermsAndPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);
  const operatorName = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'the operator of this APREP deployment';
  const privacyContact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT?.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Demo terms & privacy" size="lg">
      <div className="max-h-[calc(100svh-10rem)] overflow-y-auto pr-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-semibold text-slate-900">APREP is an open demonstration.</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                It is an evaluation aid, not a security certification or professional recommendation. Automated
                scores can be incomplete or wrong and should be reviewed with the underlying answers.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Legal information">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              onClick={() => setActiveTab('privacy')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === 'privacy' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Privacy
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terms'}
              onClick={() => setActiveTab('terms')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === 'terms' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Terms
            </button>
          </div>
          <p className="text-xs text-slate-400">Effective August 12, 2026</p>
        </div>

        <div className="mt-5">
          {activeTab === 'privacy' ? (
            <div role="tabpanel">
              <LegalSection icon={UserRoundCheck} title="Who is responsible">
                <p>
                  <strong className="font-semibold text-slate-800">{operatorName}</strong> controls how personal
                  data is processed in this deployed instance. Independently deployed copies have their own operator,
                  who must provide an identity and working privacy contact.
                </p>
                <p>
                  {privacyContact ? (
                    <>
                      Privacy requests may be sent to{' '}
                      <a className="font-medium text-sky-700 underline" href={`mailto:${privacyContact}`}>
                        {privacyContact}
                      </a>
                      .
                    </>
                  ) : (
                    'Privacy requests should be sent through the contact channel published by the operator with this demo.'
                  )}
                </p>
              </LegalSection>

              <LegalSection icon={Database} title="Information APREP processes">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Your account email, password hash, account identifier, and timestamps.</li>
                  <li>
                    Project names, endpoint URLs, request templates, response paths, authentication settings, and an
                    encrypted endpoint token when one is supplied.
                  </li>
                  <li>
                    Prompt text and file type, question sets, expected answers, generated questions, and evaluation
                    purpose text. APREP stores extracted prompt text, not the original uploaded file.
                  </li>
                  <li>
                    Evaluation questions, agent answers, response times, scores, explanations, recommendations, and
                    evaluation history.
                  </li>
                  <li>
                    A keyed, non-reversible IP fingerprint and short-lived counters for request limits and daily
                    evaluation limits. The application database does not store the raw IP for these controls.
                  </li>
                  <li>
                    Your browser stores the sign-in token, basic account profile, and tutorial preference locally on
                    the device.
                  </li>
                </ul>
              </LegalSection>

              <LegalSection icon={FileText} title="Why it is used">
                <p>
                  Data is used to create and secure accounts, save project configuration, contact the endpoint you
                  choose, generate questions, run and explain evaluations, preserve history, enforce service limits,
                  prevent abuse, troubleshoot failures, and meet legal obligations.
                </p>
                <p>
                  Do not submit another person&apos;s personal or sensitive information unless you have a lawful basis,
                  appropriate notice or authorization, and a genuine need to process it.
                </p>
              </LegalSection>

              <LegalSection icon={Share2} title="External services and disclosures">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    The agent endpoint you configure receives evaluation questions in the request template and, when
                    enabled, its authorization token.
                  </li>
                  <li>
                    The configured scoring or question-generation service may receive questions, agent answers,
                    prompts, optional expected answers, and generation instructions needed for those features.
                  </li>
                  <li>
                    Hosting, database, and network providers may process ordinary service metadata, including raw IP
                    addresses in infrastructure logs, under their own retention and security terms.
                  </li>
                </ul>
                <p>APREP&apos;s current application code does not sell personal data or include advertising trackers.</p>
              </LegalSection>

              <LegalSection icon={Lock} title="Retention and security">
                <p>
                  Passwords are hashed, endpoint tokens are encrypted at rest, access is account-scoped, and abuse
                  controls use keyed IP fingerprints. These safeguards reduce risk but cannot guarantee that a breach
                  will never occur.
                </p>
                <p>
                  Project and evaluation data remains until the project is deleted or the operator removes it. Minute
                  request counters are normally removed after about two minutes; daily evaluation fingerprints are
                  normally retained for seven days. Deployment settings, backups, infrastructure logs, or legal needs
                  may change these periods.
                </p>
              </LegalSection>

              <LegalSection icon={Scale} title="Your privacy rights and applicable law">
                <p>
                  Where the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) applies, data subjects may
                  have rights to be informed, access, object, rectify, erase or block, obtain portability, file a
                  complaint, and seek damages, subject to legal conditions and exceptions.
                </p>
                <p>
                  A demo label does not cancel the operator&apos;s statutory privacy and security duties. If a qualifying
                  personal data breach occurs, the operator must follow applicable notification rules, including the
                  National Privacy Commission&apos;s 72-hour rules when their legal conditions are met.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs">
                  <a
                    href="https://privacy.gov.ph/data-privacy-act/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Data Privacy Act <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://privacy.gov.ph/data-subject-rights/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Data subject rights <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://privacy.gov.ph/pips-and-pics/breach-reporting/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Breach reporting <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </LegalSection>
            </div>
          ) : (
            <div role="tabpanel">
              <LegalSection icon={UserRoundCheck} title="Acceptable and authorized use">
                <p>
                  Use APREP only with endpoints, credentials, prompts, and data that you own or are authorized to test.
                  Do not use it to attack systems, evade controls, infringe rights, distribute unlawful content, or
                  submit secrets and personal data that are unnecessary for an evaluation.
                </p>
              </LegalSection>

              <LegalSection icon={AlertTriangle} title="Demo limitations">
                <p>
                  The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis for demonstration and
                  testing. Availability, retention, features, limits, and scoring behavior may change. Evaluation
                  scores are automated estimates and do not prove that an agent is accurate, secure, lawful, or fit
                  for production.
                </p>
              </LegalSection>

              <LegalSection icon={Share2} title="Your endpoints and third parties">
                <p>
                  You are responsible for the endpoint, request template, credentials, submitted content, expected
                  answers, and any permissions required to send that information to the endpoint, scoring service, and
                  hosting providers. Third-party services remain governed by their own terms and privacy practices.
                </p>
              </LegalSection>

              <LegalSection icon={Scale} title="Liability and legal duties">
                <p>
                  To the maximum extent permitted by applicable law, the operator and source contributors disclaim
                  implied warranties and are not responsible for indirect, incidental, special, or consequential loss
                  arising from demo use, unavailable service, automated scores, user-submitted content, or third-party
                  systems.
                </p>
                <p>
                  This limitation does not exclude liability or duties that the law does not allow to be waived. In
                  particular, it does not remove an operator&apos;s obligations as a personal information controller or
                  processor, and it is not a substitute for appropriate security controls or incident response.
                </p>
              </LegalSection>

              <LegalSection icon={FileText} title="Changes and applicable rules">
                <p>
                  Material changes should be published with a new effective date. Philippine privacy law applies when
                  the deployment or processing falls within its scope; mandatory laws in other relevant jurisdictions
                  may also apply.
                </p>
              </LegalSection>
            </div>
          )}
        </div>

        <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
          This plain-language demo notice reflects the application&apos;s current behavior and is not legal advice. A
          public operator should have the final notice and terms reviewed for its identity, hosting setup, users, data,
          and jurisdiction.
        </p>
      </div>
    </Modal>
  );
}
