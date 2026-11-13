import { Fragment, useMemo } from "react";

/**
 * Minimal, dependency-free markdown renderer for chat answers.
 *
 * The chatbot previously ran a regex that STRIPPED markdown: headings, bold,
 * inline code and fenced blocks were flattened to plain text, while list and
 * table syntax leaked through raw. For a study assistant that destroyed every
 * structured answer.
 *
 * Supports the subset an LLM actually returns: headings, bullet and numbered
 * lists, fenced code, inline code, bold, italic and links. Everything is built
 * from React elements — no dangerouslySetInnerHTML, so the model's output
 * cannot inject markup.
 */

// Inline: `code`, **bold**, *italic*, [text](url)
function renderInline(text, keyPrefix) {
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;

  const nodes = [];
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("[")) {
      const label = token.slice(1, token.indexOf("]"));
      nodes.push(
        <a
          key={key}
          href={match[5]}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium underline underline-offset-2"
        >
          {label}
        </a>
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function parseBlocks(source) {
  const lines = String(source).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ type: "code", lang, content: body.join("\n") });
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        content: heading[2],
      });
      i += 1;
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Paragraph: gather until a blank line or the start of another block
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith("```")
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "p", content: para.join(" ") });
  }

  return blocks;
}

export default function Markdown({ children, className = "" }) {
  const blocks = useMemo(() => parseBlocks(children || ""), [children]);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) => {
        const key = `b${index}`;

        switch (block.type) {
          case "heading": {
            const Tag = `h${Math.min(block.level + 2, 6)}`;
            return (
              <Tag key={key} className="text-[1.05em] font-bold">
                {renderInline(block.content, key)}
              </Tag>
            );
          }

          case "code":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-control bg-ink/90 p-3 text-[0.82em] leading-relaxed text-white"
              >
                <code>{block.content}</code>
              </pre>
            );

          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1 pl-5">
                {block.items.map((item, n) => (
                  <li key={`${key}-${n}`}>{renderInline(item, `${key}-${n}`)}</li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, n) => (
                  <li key={`${key}-${n}`}>{renderInline(item, `${key}-${n}`)}</li>
                ))}
              </ol>
            );

          default:
            return (
              <p key={key} className="leading-relaxed">
                {renderInline(block.content, key)}
              </p>
            );
        }
      })}
    </div>
  );
}
