import { useEffect, useState, type FormEvent, type RefObject } from 'react';
import { AlertCircle, CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { ShopSettings } from '../data/coffeeData';
import { submitContactMessage, type ContactTopic } from '../services/coffeeDb';

export interface PrefilledInquiry {
  topic: string;
  itemName: string;
  timestamp: number;
}

interface ContactSectionProps {
  settings: ShopSettings;
  nameInputRef: RefObject<HTMLInputElement | null>;
  prefilledInquiry: PrefilledInquiry | null;
}

interface FormValues {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
  submit?: string;
}

interface SubmittedRecord extends FormValues {
  referenceId: string;
  submittedAt: string;
}

const TOPICS: ContactTopic[] = [
  'General Inquiry',
  'Private Events & Catering',
  'Wholesale Coffee Beans',
  'Feedback',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactSection({
  settings,
  nameInputRef,
  prefilledInquiry,
}: ContactSectionProps) {
  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    topic: TOPICS[0],
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedRecord | null>(null);

  const scheduleRows = [
    { day: 'Monday – Friday', hours: settings.weekdayHours },
    { day: 'Saturday', hours: settings.saturdayHours },
    { day: 'Sunday', hours: settings.sundayHours },
  ];

  useEffect(() => {
    if (!prefilledInquiry) return;
    setSubmitted(null);
    const matchedTopic = TOPICS.find((t) => t === prefilledInquiry.topic) ?? TOPICS[0];
    setValues((prev) => ({
      ...prev,
      topic: matchedTopic,
      message: `Hi ${settings.name} team — I would like to ask about ${prefilledInquiry.itemName} for an upcoming order or event.`,
    }));
    setErrors((prev) => ({ ...prev, message: undefined, submit: undefined }));
  }, [prefilledInquiry, settings.name]);

  const validate = (form: FormValues): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your name.';
    } else if (form.name.trim().length > 100) {
      nextErrors.name = 'Name must be 100 characters or fewer.';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(form.email.trim()) || form.email.trim().length > 120) {
      nextErrors.email = 'Please enter a valid email address (for example, name@domain.com).';
    }
    if (form.message.trim().length < 10) {
      nextErrors.message = 'Please include a short message (at least 10 characters).';
    } else if (form.message.trim().length > 2000) {
      nextErrors.message = 'Message must be 2,000 characters or fewer.';
    }
    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const savedId = await submitContactMessage({
        name: values.name,
        email: values.email,
        topic: values.topic,
        message: values.message,
      });

      setSubmitted({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
        referenceId: savedId,
        submittedAt: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      });
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? 'Could not save your message right now. Please try again shortly.'
            : 'Could not save your message right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(null);
    setValues({
      name: '',
      email: '',
      topic: TOPICS[0],
      message: '',
    });
    setErrors({});
  };

  return (
    <section id="contact" className="bg-[#FAFAFA] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Visit & Hours */}
          <div id="hours" className="scroll-mt-24 lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-[#1C4A38] uppercase">
              Visit &amp; Inquiries
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl text-balance">
              Stop by the bar or send us a note.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Questions about pastry pre-orders, neighborhood catering boxes, wholesale
              espresso beans, or dietary allergens? Write to us anytime—our bar lead checks
              messages every morning.
            </p>

            {/* Hours Table */}
            <div className="mt-8 border-t border-zinc-200 pt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Clock className="h-4 w-4 text-[#1C4A38]" aria-hidden="true" />
                <span>Opening Hours</span>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                {scheduleRows.map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-zinc-600">{row.day}</dt>
                    <dd className="font-medium text-zinc-900 tabular-nums">{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Direct Contact Details */}
            <div className="mt-8 space-y-3 border-t border-zinc-200 pt-6 text-sm text-zinc-700">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1C4A38]" aria-hidden="true" />
                <span>
                  {settings.address}, {settings.cityStateZip}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#1C4A38]" aria-hidden="true" />
                <a
                  href={`tel:${settings.phone.replace(/[^\d]/g, '')}`}
                  className="tabular-nums transition-colors hover:text-zinc-900 hover:underline hover:underline-offset-4"
                >
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#1C4A38]" aria-hidden="true" />
                <a
                  href={`mailto:${settings.email}`}
                  className="transition-colors hover:text-zinc-900 hover:underline hover:underline-offset-4"
                >
                  {settings.email}
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
              {submitted ? (
                <div role="status" aria-live="polite" className="py-4">
                  <div className="flex items-center gap-2.5 text-[#1C4A38]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-semibold">
                      Saved to Inbox · {submitted.referenceId}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-medium text-zinc-900">
                    Thank you, {submitted.name}.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Your message was saved at {submitted.submittedAt}. We will reply to{' '}
                    <span className="font-medium text-zinc-900">{submitted.email}</span> within one
                    business day.
                  </p>

                  <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
                    <p className="text-xs font-medium text-zinc-500">
                      Topic · {submitted.topic}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-zinc-700">{submitted.message}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors duration-150 hover:bg-zinc-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <h3 className="font-display text-2xl font-medium text-zinc-900">
                      Send Us a Message
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      All messages are saved directly to our shop inbox for review.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-medium text-zinc-800"
                      >
                        Full Name
                      </label>
                      <input
                        ref={nameInputRef}
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        maxLength={100}
                        value={values.name}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, name: e.target.value }));
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                        placeholder="Clara Jensen"
                        className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:outline-none ${
                          errors.name
                            ? 'border-red-600 focus:border-red-600'
                            : 'border-zinc-300 focus:border-[#1C4A38]'
                        }`}
                      />
                      {errors.name && (
                        <p
                          id="contact-name-error"
                          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-zinc-800"
                      >
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={120}
                        value={values.email}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, email: e.target.value }));
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                        placeholder="clara@example.com"
                        className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:outline-none ${
                          errors.email
                            ? 'border-red-600 focus:border-red-600'
                            : 'border-zinc-300 focus:border-[#1C4A38]'
                        }`}
                      />
                      {errors.email && (
                        <p
                          id="contact-email-error"
                          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="block text-sm font-medium text-zinc-800"
                    >
                      Inquiry Topic
                    </label>
                    <select
                      id="contact-topic"
                      name="topic"
                      value={values.topic}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          topic: e.target.value as ContactTopic,
                        }))
                      }
                      className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 transition-colors focus:border-[#1C4A38] focus:outline-none"
                    >
                      {TOPICS.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-zinc-800"
                      >
                        Message
                      </label>
                      <span className="text-xs text-zinc-500 tabular-nums">
                        {values.message.trim().length} / 2000
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      maxLength={2000}
                      value={values.message}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, message: e.target.value }));
                        if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                      }}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      placeholder="Let us know how we can help — catering pastry counts, coffee bean orders, or general questions."
                      className={`mt-1.5 w-full rounded-lg border bg-white p-3.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 transition-colors focus:outline-none ${
                        errors.message
                          ? 'border-red-600 focus:border-red-600'
                          : 'border-zinc-300 focus:border-[#1C4A38]'
                      }`}
                    />
                    {errors.message && (
                      <p
                        id="contact-message-error"
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.message}</span>
                      </p>
                    )}
                  </div>

                  {errors.submit && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{errors.submit}</span>
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-zinc-500">
                      Typical response within 24 hours.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1C4A38] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#15392B] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
                    >
                      {isSubmitting ? 'Sending Message...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
