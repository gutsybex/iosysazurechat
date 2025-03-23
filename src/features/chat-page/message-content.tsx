// import { Markdown } from "@/features/ui/markdown/markdown";
import { FunctionSquare } from "lucide-react";
import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { RecursiveUI } from "../ui/recursive-ui";
// import { CitationAction } from "./citation/citation-action";
import "katex/dist/katex.min.css";

interface MessageContentProps {
  message: {
    role: string;
    content: string;
    name: string;
    multiModalImage?: string;
  };
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  if (message.role === "assistant" || message.role === "user") {
    // Regex to match block-level formulas (\[ ... \])
    const blockFormulaRegex = /\\\[(.*?)\\\]/g;
    // Regex to match inline formulas (\( ... \))
    const inlineFormulaRegex = /\\\((.*?)\\\)/g;

    // Function to process block-level formulas
    const processBlockFormula = (formula: any) => {
      return <BlockMath math={formula} />;
    };

    // Function to process inline formulas
    const processInlineFormula = (formula: any) => {
      return <InlineMath math={formula} />;
    };

    // Split content into lines to preserve newlines
    const lines = message.content.split("\n");

    // Process each line
    const processedLines = lines.map((line, index) => {
      // Process block-level formulas first
      const blockFormulaMatches = [...line.matchAll(blockFormulaRegex)];
      let processedLine = [];

      let lastIndex = 0;
      blockFormulaMatches.forEach((match) => {
        const [fullMatch, formula] = match;
        const matchIndex = match.index;
        const safeMatchIndex = matchIndex ?? 0; // Replace 0 with your desired default value

          // Add text before the formula
          if (safeMatchIndex > lastIndex) {
            processedLine.push(line.slice(lastIndex, safeMatchIndex));
          }

          // Add the processed block formula
          processedLine.push(processBlockFormula(formula));
          lastIndex = safeMatchIndex + fullMatch.length;
      });

      // Add remaining text after the last block formula
      if (lastIndex < line.length) {
        processedLine.push(line.slice(lastIndex));
      }

      // Process inline formulas in the processed line
      const finalProcessedLine = processedLine.map((part, partIndex) => {
        if (typeof part === "string") {
          // Replace inline formulas in the string part
          const inlineFormulaMatches = [...part.matchAll(inlineFormulaRegex)];
          let processedPart = [];
          let lastInlineIndex = 0;

          inlineFormulaMatches.forEach((match) => {
            const [fullMatch, formula] = match;
            const matchIndex = match.index ?? 0;

            // Add text before the inline formula
            if (matchIndex > lastInlineIndex) {
              processedPart.push(part.slice(lastInlineIndex, matchIndex));
            }

            // Add the processed inline formula
            processedPart.push(processInlineFormula(formula));
            lastInlineIndex = matchIndex + fullMatch.length;
          });

          // Add remaining text after the last inline formula
          if (lastInlineIndex < part.length) {
            processedPart.push(part.slice(lastInlineIndex));
          }

          return (
            <React.Fragment key={partIndex}>{processedPart}</React.Fragment>
          );
        }

        // If the part is already a React component, return it as is
        return <React.Fragment key={partIndex}>{part}</React.Fragment>;
      });

      // Return the processed line as a React fragment
      return (
        <React.Fragment key={index}>
          {finalProcessedLine}
          <br />
        </React.Fragment>
      );
    });

    return (
      <>
        {/*<Markdown
          content={message.content}
          onCitationClick={CitationAction}
        ></Markdown>*/}
        <div className="max-w-none">{processedLines}</div>
        {message.multiModalImage && <img src={message.multiModalImage} />}
      </>
    );
  }

  if (message.role === "tool" || message.role === "function") {
    return (
      <div className="py-3">
        <Accordion
          type="multiple"
          className="bg-background rounded-md border p-2"
        >
          <AccordionItem value="item-1" className="">
            <AccordionTrigger className="text-sm py-1 items-center gap-2">
              <div className="flex gap-2 items-center">
                <FunctionSquare
                  size={18}
                  strokeWidth={1.4}
                  className="text-muted-foreground"
                />{" "}
                Show {message.name}{" "}
                {message.name === "tool" ? "output" : "function"}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RecursiveUI documentField={toJson(message.content)} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  return null;
};

const toJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

export default MessageContent;
