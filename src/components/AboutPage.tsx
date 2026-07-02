import { Button, Card, Chip, Separator } from "@heroui/react";
import { Check, Clock3, FileText, Flame, HelpCircle, KeyRound, Lock, Server, Sparkles, X } from "lucide-react";

import { localePath, navigate } from "../hooks";
import type { Copy, Locale } from "../i18n";

const FEATURE_ICONS = [
  <Flame key="burn" className="size-4 text-warning" />,
  <KeyRound key="password" className="size-4 text-accent" />,
  <Clock3 key="expiry" className="size-4 text-success" />,
  <FileText key="markdown" className="size-4 text-muted" />,
];

// Mirrors the visible FAQ so search engines get structured data that always
// matches the rendered locale. JSON-LD script tags are inert data blocks, so
// the strict script-src CSP does not apply to them.
function FaqJsonLd({ copy }: { copy: Copy }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.about.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function AboutPage({ copy, locale }: { copy: Copy; locale: Locale }) {
  const about = copy.about;

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="animate-rise flex flex-col gap-3">
        <Chip color="accent" size="sm" variant="soft">
          <Sparkles className="size-3" />
          <Chip.Label>{about.badge}</Chip.Label>
        </Chip>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {about.titleStart}
          <span className="brand-text">{about.titleHighlight}</span>
        </h1>
        <p className="text-sm leading-6 text-muted">{about.intro}</p>
      </header>

      <section className="animate-rise-2 flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Lock className="size-4 text-accent" />
          {about.howItWorks.title}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {about.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-secondary/50 p-4">
              <span className="grid size-7 place-items-center rounded-lg bg-accent-soft font-mono text-xs text-accent-soft-foreground">
                {index + 1}
              </span>
              <h3 className="text-sm font-medium">{step.title}</h3>
              <p className="text-xs leading-5 text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="animate-rise-2 flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Sparkles className="size-4 text-accent" />
          {about.features.title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {about.features.items.map((feature, index) => (
            <div key={feature.title} className="flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary/50 p-4">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-tertiary">
                {FEATURE_ICONS[index]}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className="text-xs leading-5 text-muted">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise-2 flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Server className="size-4 text-accent" />
          {about.storage.title}
        </h2>
        <p className="text-sm leading-6 text-muted">{about.storage.description}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-transparent">
            <Card.Header>
              <Card.Title className="text-base">{about.storage.storedTitle}</Card.Title>
            </Card.Header>
            <Card.Content className="gap-2.5 text-sm text-muted">
              {about.storage.stored.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </Card.Content>
          </Card>
          <Card className="border-dashed bg-transparent">
            <Card.Header>
              <Card.Title className="text-base">{about.storage.notStoredTitle}</Card.Title>
            </Card.Header>
            <Card.Content className="gap-2.5 text-sm text-muted">
              {about.storage.notStored.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <X className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>{item}</span>
                </div>
              ))}
            </Card.Content>
          </Card>
        </div>
      </section>

      <section className="animate-rise-2 flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <HelpCircle className="size-4 text-accent" />
          {about.faq.title}
        </h2>
        <div className="flex flex-col gap-5">
          {about.faq.items.map((item, index) => (
            <div key={item.question} className="flex flex-col gap-2">
              {index > 0 ? <Separator className="mb-3" /> : null}
              <h3 className="text-sm font-medium">{item.question}</h3>
              <p className="text-sm leading-6 text-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise-2 flex flex-col items-start gap-3 rounded-2xl border border-accent/30 bg-surface-secondary/50 p-6">
        <h2 className="text-xl font-semibold tracking-tight">{about.cta.title}</h2>
        <p className="text-sm text-muted">{about.cta.description}</p>
        <Button className="brand-glow" size="lg" onPress={() => navigate(localePath(locale, "/"))}>
          <Lock className="size-4" />
          {about.cta.button}
        </Button>
      </section>

      <FaqJsonLd copy={copy} />
    </article>
  );
}
