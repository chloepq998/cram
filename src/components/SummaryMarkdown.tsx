type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({ kind: "list", items: listBuffer });
      listBuffer = [];
    }
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ kind: "heading", text: line.slice(3) });
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      blocks.push({ kind: "paragraph", text: line });
    }
  }
  flushList();
  return blocks;
}

export function SummaryMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h3 key={index} className="text-base font-semibold text-zinc-900">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-sm text-zinc-700">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-sm text-zinc-700">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
