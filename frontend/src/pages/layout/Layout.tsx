import { Outlet, Link, NavLink } from "react-router-dom";
import styles from "./Layout.module.css";
import Azure from "../../assets/Azure.svg";
import { CopyRegular, ShareRegular } from "@fluentui/react-icons";
import { Dialog, Stack, TextField } from "@fluentui/react";
import { useEffect, useState } from "react";
import esaiStyles from "./Layout.esai.module.css";

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
                        <Link to="/" className={styles.headerTitleContainer}>
                            <h3 className={styles.headerTitle}>E+D AI Assistant</h3>
                        </Link>
                        <nav>
                            <ul className={esaiStyles.headerNavList}>
                                {/* <li>
                                    <NavLink to="/" className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Chat
                                    </NavLink>
                                </li> */}
                                <li>
                                    <NavLink to="/" className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Help
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbRxl8XViM761GhvM3jg9uC4NUNUdLQ1YwTUpJWDZHN1RBMUFZWjREODEyQi4u" 
                                    target="_blank" className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Submit content for Review
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://msdpn.azurewebsites.net/" target="_blank" 
                                    className={({ isActive }) => (isActive ? esaiStyles.headerNavPageLinkActive : esaiStyles.headerNavPageLink)}>
                                        Data Privacy Notice
                                    </NavLink>
                                </li>
                            </ul>
                        </nav>
                    </Stack>
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
