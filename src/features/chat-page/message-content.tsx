import { Markdown } from "@/features/ui/markdown/markdown";
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
import { CitationAction } from "./citation/citation-action";
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
    // Regex to match bold text (** ... **)
    const boldTextRegex = /\*\*(.*?)\*\*/g;

    // Function to process block-level formulas
    const processBlockFormula = (formula: string) => {
      return <BlockMath math={formula} />;
    };

    // Function to process inline formulas
    const processInlineFormula = (formula: string) => {
      return <InlineMath math={formula} />;
    };

    // Function to process bold text
    const processBoldText = (text: string) => {
      return <strong>{text}</strong>;
    };

    const initialContent = `For DC motor drive applications, some of the most important formulas include those related to current, torque, power, and dynamic braking. Here are the key formulas that are frequently used:\n\n1. **Current and Torque Relationship:**\n \\[\n \\text{Torque} \\propto \\text{Armature Current}\n \\]\n Armature current (\\(I_a\\)) is directly proportional to the torque (\\(\\tau\\)) produced by the motor.\n\n2. **Power Calculation:**\n \\[\n P = VI\n \\]\n Where \\(P\\) is the power in watts, \\(V\\) is the voltage in volts, and \\(I\\) is the current in amperes.\n\n3. **Power Formula for Three-Phase Systems:**\n \\[\n P = \\sqrt{3} \\times V_L \\times I_L \\times \\text{Power Factor}\n \\]\n Where:\n - \\(P\\) is the power in watts.\n - \\(V_L\\) is the line voltage.\n - \\(I_L\\) is the line current.\n - \\(\\text{Power Factor}\\) is the power factor of the motor, assumed typically at full speed, full torque, and full voltage.\n\n4. **Inertia Calculation (total inertia):**\n \\[\n J_{\\text{Total}} = J_{\\text{Load}} + J_{\\text{Drive Pulley}} + J_{\\text{Tail Pulley}} + J_{\\text{Idler Roller}} + \\left(J_{\\text{Rotor}} \\times \\text{Gear Ratio}^2\\right)\n \\]\n\n5. **Torque Calculation for Acceleration:**\n \\[\n T_{\\text{Accel}} = J_{\\text{Total}} \\times \\frac{\\Delta \\omega}{t_{\\text{Accel}}}\n \\]\n Where \\(J_{\\text{Total}}\\) is the total inertia, \\(\\Delta \\omega\\) is the change in angular velocity, and \\(t_{\\text{Accel}}\\) is the time to accelerate.\n\n6. **Dynamic Braking Power Dissipation:**\n \\[\n P_{\\text{Peak}} = P_{\\text{Decel}} \\times \\text{motor efficiency}\n \\]\n \\[\n P_{\\text{Ave}} = \\frac{P_{\\text{Peak}} \\times \\text{decel time}}{\\text{cycle time}}\n \\]\n\n7. **Overload Capacity:**\n DC drives typically have these overload capacities:\n \\[\n \\begin{align*}\n 100\\% & \\text{ of rated current continuously} \\\\\n 150\\% & \\text{ of rated current for 1 minute} \\\\\n 200\\% & \\text{ of rated current for 10 seconds} \\\\\n 250\\% & \\text{ of rated current for 2 or 3 seconds}\n \\end{align*}\n \\]\n\n8. **AC Drive Overload Capacity for Comparison:**\n \\[\n \\begin{align*}\n 100\\% & \\text{ of rated current continuously} \\\\\n 150\\% & \\text{ of rated current for 1 minute} \\\\\n 200\\% & \\text{ of rated current for 2 or 3 seconds}\n \\end{align*}\n \\]\n\nThe above formulas can help in the design, assessment, and comparison of DC motor and drive systems to ensure they meet the necessary requirements for a given application.\n\n{% citation items=[{name:\"drive-at001_-en-p (1).pdf\",id:\"GPwrxob0NiOsmPxScsm9wbeXixfd3II64r4z\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"3c3L3a1KlOMoFg1fUznq7OfxpDaKz8fX9fER\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"O3GEDD3X2K9om9mc3sIRpIQIO79ceCX6xPqj\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"FzkE0m4vp0fembey47gxrqhjv1m6HTXTGcu7\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"ibT5qNiAB3acGDr4g6Rijs1shJyaz0dJPerI\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"UkiUNoX4RGYXMAYklUqGzSlXdVPYi1F331Sg\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"pZFZhcjSIz9qcSyb5sFpPFhD2jIRyY9WtuRR\"},{name:\"drive-at001_-en-p (1).pdf\",id:\"wlDVETrK2rqv8D9GikcbYSWmwco158GYRGw5\"}] /%}`;

    // Split content into lines to preserve newlines
    const citationContent = initialContent.match(/{%.*?%}/g);
    const cleanedContent = initialContent
      .replace(/{%.*?%}/g, "")
      .trim()
      .replace(/\\\[\n/g, "\\[")
      .replace(/\n \\]/g, "\\]")
      .replace(/}\n/g, "}")
      .replace(/\\n \\\\end/g, "\\\\end")
      .replace(/\\\\\n/g, "\\\\")
      .split("\n");

    // Process each line
    const processedLines = cleanedContent.map((line, index) => {
      // Process block-level formulas first
      const blockFormulaMatches = [...line.matchAll(blockFormulaRegex)];
      let processedLine = [];

      let lastIndex = 0;
      blockFormulaMatches.forEach((match) => {
        const [fullMatch, formula] = match;
        const matchIndex = match.index ?? 0;

        // Add text before the formula
        if (matchIndex > lastIndex) {
          processedLine.push(line.slice(lastIndex, matchIndex));
        }

        // Add the processed block formula
        processedLine.push(processBlockFormula(formula));
        lastIndex = matchIndex + fullMatch.length;
      });

      // Add remaining text after the last block formula
      if (lastIndex < line.length) {
        processedLine.push(line.slice(lastIndex));
      }

      // Process inline formulas and bold text in the processed line
      const finalProcessedLine = processedLine.map((part, partIndex) => {
        if (typeof part === "string") {
          // Process bold text first
          const boldTextMatches = [...part.matchAll(boldTextRegex)];
          let processedPart = [];
          let lastBoldIndex = 0;

          boldTextMatches.forEach((match) => {
            const [fullMatch, text] = match;
            const matchIndex = match.index ?? 0;

            // Add text before the bold text
            if (matchIndex > lastBoldIndex) {
              processedPart.push(part.slice(lastBoldIndex, matchIndex));
            }

            // Add the processed bold text
            processedPart.push(processBoldText(text));
            lastBoldIndex = matchIndex + fullMatch.length;
          });

          // Add remaining text after the last bold text
          if (lastBoldIndex < part.length) {
            processedPart.push(part.slice(lastBoldIndex));
          }

          // Now process inline formulas in each part
          processedPart = processedPart.map((subPart, subPartIndex) => {
            if (typeof subPart === "string") {
              const inlineFormulaMatches = [
                ...subPart.matchAll(inlineFormulaRegex),
              ];
              let finalSubPart = [];
              let lastInlineIndex = 0;

              inlineFormulaMatches.forEach((match) => {
                const [fullMatch, formula] = match;
                const matchIndex = match.index ?? 0;

                // Add text before the inline formula
                if (matchIndex > lastInlineIndex) {
                  finalSubPart.push(subPart.slice(lastInlineIndex, matchIndex));
                }

                // Add the processed inline formula
                finalSubPart.push(processInlineFormula(formula));
                lastInlineIndex = matchIndex + fullMatch.length;
              });

              // Add remaining text after the last inline formula
              if (lastInlineIndex < subPart.length) {
                finalSubPart.push(subPart.slice(lastInlineIndex));
              }

              return (
                <React.Fragment key={subPartIndex}>
                  {finalSubPart}
                </React.Fragment>
              );
            }
            return subPart;
          });

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
        {processedLines}
        {citationContent && citationContent?.length > 0 && (
          <Markdown
            content={citationContent?.[0] || ""}
            onCitationClick={CitationAction}
          ></Markdown>
        )}
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
