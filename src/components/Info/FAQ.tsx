import React, { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Search } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: { en: 'What is a Page Schema?', de: 'Was ist ein Seitenschema?' },
    answer: {
      en: 'A Page Schema defines the structure and fields of a page type — similar to a template blueprint. It tells the CMS (and any connected frontend) what fields exist, their types, and how content should be structured. Schemas are created under /pages.',
      de: 'Ein Seitenschema definiert die Struktur und Felder eines Seitentyps – ähnlich wie eine Vorlagenvorlage. Es teilt dem CMS (und allen verbundenen Frontends) mit, welche Felder existieren, deren Typen und wie Inhalte strukturiert sein sollen. Schemas werden unter /pages erstellt.',
    },
  },
  {
    id: 2,
    question: { en: 'How do I create a new page?', de: 'Wie erstelle ich eine neue Seite?' },
    answer: {
      en: 'Navigate to /pages, select a schema, then click "New Page". The Page Builder opens with all fields defined by that schema. Fill in the content, set a slug, and save. Pages are saved as drafts by default.',
      de: 'Navigiere zu /pages, wähle ein Schema aus und klicke auf "Neue Seite". Der Page Builder öffnet sich mit allen durch dieses Schema definierten Feldern. Fülle den Inhalt aus, lege einen Slug fest und speichere. Seiten werden standardmäßig als Entwürfe gespeichert.',
    },
  },
  {
    id: 3,
    question: { en: 'What are Content Blocks?', de: 'Was sind Content Blocks?' },
    answer: {
      en: 'Content Blocks are flexible, typed pieces of content within a page field. Types include text (with formatting), heading (H1–H6), image, quote, list, and video. Multiple blocks can be combined in any order to build rich page sections.',
      de: 'Content Blocks sind flexible, typisierte Inhaltselemente innerhalb eines Seitenfeldes. Typen umfassen Text (mit Formatierung), Überschrift (H1–H6), Bild, Zitat, Liste und Video. Mehrere Blöcke können in beliebiger Reihenfolge kombiniert werden, um umfangreiche Seitenabschnitte zu erstellen.',
    },
  },
  {
    id: 4,
    question: { en: 'How do I connect a frontend to the CMS?', de: 'Wie verbinde ich ein Frontend mit dem CMS?' },
    answer: {
      en: 'Open /pages and click "Start Registration" on a schema. This generates a one-time registration code. Your frontend (or an LLM agent) then POSTs to /api/schemas/{slug}/register with the code, frontend URL, and revalidation config. The schema status switches to "registered" once complete.',
      de: 'Öffne /pages und klicke bei einem Schema auf "Registrierung starten". Dadurch wird ein Einmal-Registrierungscode generiert. Dein Frontend (oder ein LLM-Agent) sendet dann einen POST an /api/schemas/{slug}/register mit dem Code, der Frontend-URL und der Revalidierungskonfiguration. Der Schema-Status wechselt nach Abschluss auf "registriert".',
    },
  },
  {
    id: 5,
    question: { en: 'What is ISR / revalidation?', de: 'Was ist ISR / Revalidierung?' },
    answer: {
      en: 'ISR (Incremental Static Regeneration) lets the CMS notify your frontend to refresh cached pages after content is saved. When a page is published, the CMS calls your registered revalidation endpoint automatically. Configure the endpoint and a shared secret during frontend registration.',
      de: 'ISR (Inkrementelle Statische Regenerierung) ermöglicht es dem CMS, dein Frontend zu benachrichtigen, gecachte Seiten nach dem Speichern von Inhalten zu aktualisieren. Wenn eine Seite veröffentlicht wird, ruft das CMS automatisch deinen registrierten Revalidierungsendpunkt auf. Konfiguriere den Endpunkt und ein gemeinsames Geheimnis während der Frontend-Registrierung.',
    },
  },
  {
    id: 6,
    question: { en: 'How does the MCP agent endpoint work?', de: 'Wie funktioniert der MCP-Agenten-Endpunkt?' },
    answer: {
      en: 'The /mcp endpoint exposes four tools for AI agents: list_schemas, get_schema_spec, register_frontend, and check_health. Connect any MCP-compatible agent (e.g. GitHub Copilot, Claude) to this URL to let it discover schemas and build or register a frontend automatically.',
      de: 'Der /mcp-Endpunkt stellt vier Tools für KI-Agenten bereit: list_schemas, get_schema_spec, register_frontend und check_health. Verbinde einen beliebigen MCP-kompatiblen Agenten (z.B. GitHub Copilot, Claude) mit dieser URL, damit er Schemas entdecken und ein Frontend automatisch erstellen oder registrieren kann.',
    },
  },
  {
    id: 7,
    question: { en: 'What is the slug structure field?', de: 'Was ist das Slug-Struktur-Feld?' },
    answer: {
      en: 'The slug structure defines how the CMS builds preview URLs for pages. Use ":slug" as a placeholder — e.g. "/blog/:slug" maps to "/blog/my-post" on your frontend. Set this during registration. The Page Builder uses it to generate the live preview link.',
      de: 'Die Slug-Struktur definiert, wie das CMS Vorschau-URLs für Seiten erstellt. Verwende ":slug" als Platzhalter – z.B. "/blog/:slug" ergibt "/blog/mein-beitrag" auf deinem Frontend. Lege dies während der Registrierung fest. Der Page Builder nutzt es, um den Live-Vorschau-Link zu generieren.',
    },
  },
  {
    id: 8,
    question: { en: 'How do I publish a draft page?', de: 'Wie veröffentliche ich eine Entwurfsseite?' },
    answer: {
      en: 'Open the page in the Page Builder, change the status selector from "Draft" to "Published", and save. If a frontend is registered for the schema, the CMS will automatically trigger revalidation so the new content goes live.',
      de: 'Öffne die Seite im Page Builder, ändere den Statusschalter von "Entwurf" auf "Veröffentlicht" und speichere. Wenn ein Frontend für das Schema registriert ist, löst das CMS automatisch eine Revalidierung aus, damit der neue Inhalt live geht.',
    },
  },
  {
    id: 9,
    question: { en: 'How do I disconnect a frontend (Unhook)?', de: 'Wie trenne ich ein Frontend (Unhook)?' },
    answer: {
      en: 'In the /pages domain view, find the TLD card for the registered domain and click "Unhook". After confirming, all schemas under that domain are reset to "pending" and the stored frontend URL and revalidation config are cleared. The registration code is invalidated.',
      de: 'Suche in der /pages-Domainansicht die TLD-Karte für die registrierte Domain und klicke auf "Unhook". Nach der Bestätigung werden alle Schemas unter dieser Domain auf "ausstehend" zurückgesetzt und die gespeicherte Frontend-URL sowie die Revalidierungskonfiguration werden gelöscht. Der Registrierungscode wird ungültig.',
    },
  },
  {
    id: 10,
    question: { en: 'Where can I see the LLM-ready schema specification?', de: 'Wo finde ich die LLM-fertige Schemaspezifikation?' },
    answer: {
      en: 'Each schema exposes a plain-text spec at GET /api/schemas/{slug}/spec.txt. This file contains field definitions, content block types, LLM instructions, and a registration payload example — designed for AI agents to ingest directly.',
      de: 'Jedes Schema stellt eine Klartextspezifikation unter GET /api/schemas/{slug}/spec.txt bereit. Diese Datei enthält Felddefinitionen, Content-Block-Typen, LLM-Anweisungen und ein Registrierungs-Payload-Beispiel – konzipiert für KI-Agenten zum direkten Einlesen.',
    },
  },
];

const FAQ = () => {
  const { language, theme } = useTheme();
  const [query, setQuery] = useState('');

  const filteredFaqs = useMemo(
    () =>
      faqs.filter(({ question, answer }) => {
        const q = language === 'en' ? question.en : question.de;
        const a = language === 'en' ? answer.en : answer.de;
        return `${q} ${a}`.toLowerCase().includes(query.toLowerCase());
      }),
    [query, language]
  );

  return (
    <>
      <h1
        id="faq-heading"
        className="text-4xl font-extrabold mb-6 text-center"
      >
        {language === 'en' ? 'Frequently Asked Questions' : 'Häufig gestellte Fragen'}
      </h1>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'en' ? 'Search…' : 'Suche…'}
          aria-label={language === 'en' ? 'Search questions' : 'Fragen durchsuchen'}
          className={`
            w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors
            ${theme === 'dark'
              ? 'border-gray-700 bg-gray-800 placeholder-gray-400 text-gray-100 focus:border-blue-400 focus:ring-blue-500'
              : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:border-blue-600 focus:ring-blue-600'}
          `}
        />
      </div>

      {/* FAQ List */}
      {filteredFaqs.length === 0 ? (
        <p className="text-center text-gray-500">
          {language === 'en' ? 'No results found.' : 'Keine Ergebnisse gefunden.'}
        </p>
      ) : (
        <div className="space-y-6">
          {filteredFaqs.map(({ id, question, answer }) => (
            <div
              key={id}
              className={`
                border rounded-lg p-5
                ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-100'
                  : 'bg-gray-100 border-gray-200 text-gray-900'}
              `}
            >
              <h2 className="text-lg font-semibold mb-2">
                {language === 'en' ? question.en : question.de}
              </h2>
              <p className="leading-relaxed">
                {language === 'en' ? answer.en : answer.de}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FAQ;

  {
    id: 1,
    question: 'Wie finde ich verfügbare Veranstaltungen?',
    answer:
      'Nach dem Login landest du in der Events-Übersicht. Dort siehst du alle bevorstehenden Veranstaltungen in einer Grid-Ansicht mit Tabs für alle Veranstaltungen, meine Veranstaltungen und das Archiv.',
  },
  {
    id: 2,
    question: 'Als MentorIn: Wie sende ich eine Anfrage?',
    answer:
      'In der Grid- oder Listenansicht klickst du entweder direkt auf “Anfrage als MentorIn” oder auf eine Veranstaltung, um zur Detailseite zu gelangen. Dort tippst du auf den Button „Anfrage als MentorIn“, um deine Mentoranfrage abzuschicken.',
  },
  {
    id: 3,
    question: 'Wie sehe ich meine gebuchten und angefragten Veranstaltungen?',
    answer:
      'Wechsle in der Events-Übersicht zum Tab „Meine Events“. Dort findest du getrennt deine bevorstehenden und deine vergangenen Veranstaltungen.',
  },
  {
    id: 4,
    question: 'Wie wechsle ich zur Kalenderansicht?',
    answer:
      'Wähle im Hauptmenü den Punkt „Kalender“ aus. In der Monatsansicht siehst du alle Veranstaltungen in einem Raster und kannst einzelne Tage anklicken, um Details anzuzeigen.',
  },
  {
    id: 5,
    question: 'Als MitarbeiterIn: Wie lege ich selbst eine neue Veranstaltung an?',
    answer:
      'Klicke oben rechts auf den Button „Neue Veranstaltung“. Du wirst zu einem Formular geführt, in dem du alle relevanten Felder ausfüllst und deine Veranstaltung erstellst.',
  },
  {
    id: 6,
    question: 'Wie bearbeite oder lösche ich eine Veranstaltung?',
    answer:
      'Auf der Detailseite einer Veranstaltung findest du die Buttons „Bearbeiten“ und „Löschen“.',
  },
  {
    id: 7,
    question: 'Wie bearbeite ich mein Profil?',
    answer:
      'Das ist derzeit dem Management vorbehalten, bitte wende dich dazu an die entsprechenden mentoring manager.',
  },
  {
    id: 8,
    question: 'Wie passe ich die App-Einstellungen an?',
    answer:
      'Im Bereich „Settings“ legst du deine bevorzugte Standardansicht (Grid oder Liste) fest. Die Einstellungen werden für deinen nächsten Besuch gespeichert. Weitere Einstellungen folgen.',
  },
  {
    id: 9,
    question: 'Wie gebe ich Feedback oder melde ich Bugs?',
    answer:
      'Rechts unten werden dir jederzeit die Buttons „Feedback“ und „Bug Report“ angezeigt. Mit einem Klick darauf öffnet sich jeweils ein Formular, das dein Anliegen direkt an uns sendet.',
  },
];

const FAQ = () => {
  const { language, theme } = useTheme();
  const [query, setQuery] = useState('');

  const filteredFaqs = useMemo(
    () =>
      faqs.filter(({ question, answer }) =>
        `${question} ${answer}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <>
      <h1
        id="faq-heading"
        className="text-4xl font-extrabold mb-6 text-center"
      >
        {language === 'en'
          ? 'Frequently Asked Questions'
          : 'Häufig gestellte Fragen'}
      </h1>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'en' ? 'Search…' : 'Suche…'}
          aria-label={language === 'en' ? 'Search questions' : 'Fragen durchsuchen'}
          className={`
            w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors
            ${theme === 'dark'
              ? 'border-gray-700 bg-gray-800 placeholder-gray-400 text-gray-100 focus:border-blue-400 focus:ring-blue-500'
              : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:border-blue-600 focus:ring-blue-600'}
          `}
        />
      </div>

      {/* FAQ List */}
      {filteredFaqs.length === 0 ? (
        <p className="text-center text-gray-500">
          {language === 'en' ? 'No results found.' : 'Keine Ergebnisse gefunden.'}
        </p>
      ) : (
        <div className="space-y-6">
          {filteredFaqs.map(({ id, question, answer }) => (
            <div
              key={id}
              className={`
                border rounded-lg p-5
                ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-100'
                  : 'bg-gray-100 border-gray-200 text-gray-900'}
              `}
            >
              <h2 className="text-lg font-semibold mb-2">{question}</h2>
              <p className="leading-relaxed">{answer}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FAQ;
