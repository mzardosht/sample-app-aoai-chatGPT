import { useEffect, useMemo, useState } from "react";
import { useBoolean } from "@fluentui/react-hooks"
import { FontIcon, Stack, Text } from "@fluentui/react";

import styles from "./Answer.module.css";

import { AskResponse, Citation } from "../../api";
import { parseAnswer } from "./AnswerParser";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supersub from 'remark-supersub'
import { Sparkle28Filled, ThumbDislike20Filled, ThumbLike20Filled } from "@fluentui/react-icons";
import appInsights from "../../appInsights";

interface Props {
    answer: AskResponse;
    onCitationClicked: (citedDocument: Citation) => void;
    onLikeResponseClicked: () => void;
    onDislikeResponseClicked: () => void;
}

export const Answer = ({
    answer,
    onCitationClicked,
    onLikeResponseClicked,
    onDislikeResponseClicked
}: Props) => {
    const [feedback, setFeedback] = useState<number>(0);

    const [isRefAccordionOpen, { toggle: toggleIsRefAccordionOpen }] = useBoolean(false);
    const filePathTruncationLimit = 50;

    const parsedAnswer = useMemo(() => parseAnswer(answer), [answer]);
    const [chevronIsExpanded, setChevronIsExpanded] = useState(isRefAccordionOpen);

    const handleChevronClick = () => {
        setChevronIsExpanded(!chevronIsExpanded);
        toggleIsRefAccordionOpen();
      };

    useEffect(() => {
        setChevronIsExpanded(isRefAccordionOpen);
    }, [isRefAccordionOpen]);

    const createCitationFilepath = (citation: Citation, index: number, truncate: boolean = false) => {
        let citationFilename = "";

        if (citation.filepath && citation.chunk_id) {
            if (truncate && citation.filepath.length > filePathTruncationLimit) {
                const citationLength = citation.filepath.length;
                citationFilename = `${citation.filepath.substring(0, 20)}...${citation.filepath.substring(citationLength -20)} - Part ${parseInt(citation.chunk_id) + 1}`;
            }
            else {
                citationFilename = `${citation.filepath} - Part ${parseInt(citation.chunk_id) + 1}`;
            }
        }
        else {
            citationFilename = `Citation ${index}`;
        }
        return citationFilename;
    }

    return (
        <>
            <Stack className={styles.answerContainer}>
                <Stack.Item style={{ width: "100%" }}>
                    <Stack horizontal horizontalAlign="space-between">
                        <Sparkle28Filled aria-hidden="true" aria-label="Answer logo" />
                        {parsedAnswer.markdownFormatText!=="AI Learning Assistant is generating answer..." && (<Stack horizontal>
                            <ThumbLike20Filled
                                aria-hidden="false"
                                aria-label="Like this response"
                                onClick={() => { setFeedback(1); onLikeResponseClicked(); }}
                                style={feedback > 0 ? { color: "darkgreen" } : { color: "lightgrey" }}
                            />
                            <ThumbDislike20Filled
                                aria-hidden="false"
                                aria-label="Dislike this response"
                                onClick={() => { setFeedback(-1); onDislikeResponseClicked(); }}
                                style={feedback < 0 ? { color: "darkred" } : { color: "lightgrey" }}
                            />
                        </Stack>
                        )}
                    </Stack>
                </Stack.Item>
                <Stack.Item grow>
                    <ReactMarkdown
                        linkTarget="_blank"
                        remarkPlugins={[remarkGfm, supersub]}
                        children={parsedAnswer.markdownFormatText}
                        className={styles.answerText}
                    />
                </Stack.Item>
                <Stack horizontal className={styles.answerFooter}>
                {!!parsedAnswer.citations.length && (
                    <Stack.Item aria-label="References"
                        onKeyDown={e => e.key === "Enter" || e.key === " " ? toggleIsRefAccordionOpen() : null}
                    >
                        <Stack style={{width: "100%"}} >
                            <Stack horizontal horizontalAlign='start' verticalAlign='center'>
                                <Text
                                    className={styles.accordionTitle}
                                    onClick={toggleIsRefAccordionOpen}
                                >
                                <span>{parsedAnswer.citations.length > 1 ? parsedAnswer.citations.length + " references" : "1 reference"}</span>
                                </Text>
                                <FontIcon className={styles.accordionIcon}
                                onClick={handleChevronClick} iconName={chevronIsExpanded ? 'ChevronDown' : 'ChevronRight'}
                                />
                            </Stack>
                            
                        </Stack>
                    </Stack.Item>
                )}
                <Stack.Item className={styles.answerDisclaimerContainer}>
                    <span className={styles.answerDisclaimer}>AI-generated content by AI Learning Assistant may be incorrect</span>
                </Stack.Item>
                </Stack>
                {chevronIsExpanded && 
                    <div style={{ marginTop: 8, display: "flex", flexFlow: "wrap column", maxHeight: "150px", gap: "4px" }}>
                        {parsedAnswer.citations.map((citation, idx) => {
                            return (
                                <span 
                                    title={createCitationFilepath(citation, ++idx)} 
                                    tabIndex={0} 
                                    role="link" 
                                    key={idx} 
                                    onClick={() => onCitationClicked(citation)} 
                                    onKeyDown={e => e.key === "Enter" || e.key === " " ? onCitationClicked(citation) : null}
                                    className={styles.citationContainer}
                                    aria-label={createCitationFilepath(citation, idx)}
                                >
                                    <div className={styles.citation}>{idx}</div>
                                    {createCitationFilepath(citation, idx, true)}
                                </span>);
                        })}
                    </div>
                }
            </Stack>
        </>
    );
};
