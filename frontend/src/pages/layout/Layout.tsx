import { Outlet, NavLink } from "react-router-dom";
import styles from "./Layout.module.css";
import { CopyRegular, ShareRegular } from "@fluentui/react-icons";
import { Dialog, Stack, TextField } from "@fluentui/react";
import { useEffect, useState } from "react";
import esaiStyles from "./Layout.esai.module.css";
import ESAILogo from "../../assets/ESAILogoBeta.png";

const Layout = () => {
    const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
    const [copyClicked, setCopyClicked] = useState<boolean>(false);
    const [copyText, setCopyText] = useState<string>("Copy URL");

    const handleShareClick = () => {
        setIsSharePanelOpen(true);
    };

    const handleSharePanelDismiss = () => {
        setIsSharePanelOpen(false);
        setCopyClicked(false);
        setCopyText("Copy URL");
    };

    const handleCopyClick = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopyClicked(true);
    };

    useEffect(() => {
        if (copyClicked) {
            setCopyText("Copied URL");
        }
    }, [copyClicked]);

    return (
        <div className={styles.layout}>
            <header className={styles.header} role={"banner"}>
                <div className={styles.headerContainer}>
                    <Stack horizontal verticalAlign="center">
                        <a href="/" className={styles.headerTitleContainer}>
                            <img src={ESAILogo} alt="ESAI Logo" className={styles.headerIcon}/>
                            <h3 className={styles.headerTitle}>AI Learning Assistant</h3>
                        </a>
                        <nav>
                            <ul className={esaiStyles.headerNavList}>
                                <li>
                                    <NavLink to="/" className={esaiStyles.headerNavPageLink}>
                                        Getting Started
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/" className={esaiStyles.headerNavPageLink}>
                                        FAQs
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://microsoft.sharepoint.com/teams/ExDAI"
                                        target="_blank" className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Browse E+D AI
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://microsoft.sharepoint.com/teams/EraOfAI"
                                        target="_blank" className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Browse Era of AI
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" 
                                    className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Privacy Statement
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://msdpn.azurewebsites.net/" target="_blank" 
                                    className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Data Protection Notice
                                    </NavLink>
                                </li>
                            </ul>
                        </nav>
                    </Stack>
                </div>
                <div>
                    <p className={esaiStyles.note}><i>AI Learning Assistant is in beta and can make mistakes, so remember to verify info and share your feedback.</i></p>
                </div>
            </header>
            <Outlet />
            <Dialog 
                onDismiss={handleSharePanelDismiss}
                hidden={!isSharePanelOpen}
                styles={{
                    
                    main: [{
                        selectors: {
                          ['@media (min-width: 480px)']: {
                            maxWidth: '600px',
                            background: "#FFFFFF",
                            boxShadow: "0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)",
                            borderRadius: "8px",
                            maxHeight: '200px',
                            minHeight: '100px',
                          }
                        }
                      }]
                }}
                dialogContentProps={{
                    title: "Share the web app",
                    showCloseButton: true
                }}
            >
                <Stack horizontal verticalAlign="center" style={{gap: "8px"}}>
                    <TextField className={styles.urlTextBox} defaultValue={window.location.href} readOnly/>
                    <div 
                        className={styles.copyButtonContainer} 
                        role="button" 
                        tabIndex={0} 
                        aria-label="Copy" 
                        onClick={handleCopyClick}
                        onKeyDown={e => e.key === "Enter" || e.key === " " ? handleCopyClick() : null}
                    >
                        <CopyRegular className={styles.copyButton} />
                        <span className={styles.copyButtonText}>{copyText}</span>
                    </div>
                </Stack>
            </Dialog>
        </div>
    );
};

export default Layout;
