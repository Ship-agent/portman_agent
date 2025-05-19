import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
    Box,
    ToggleButtonGroup,
    ToggleButton,
    Typography,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
} from '@mui/material';
import * as xmlJs from 'xml-js';
import * as yaml from 'js-yaml';
import {
    Download as DownloadIcon,
    Search as SearchIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// CSS styles for syntax highlighting
const styles = `
.xml-tag { color: #0066aa; }
.xml-name { color: #116644; }
.xml-attr { color: #008844; }
.attr-name { color: #7D2E68; }
.attr-value { color: #0A3069; }
.yaml-key { color: #116644; }
.yaml-value { color: #0A3069; }
.search-match { background-color: #FFFF00; color: #000000; font-weight: bold; }
.line-number { 
    color: #666;
    user-select: none;
    width: 40px;
    text-align: right;
    padding-right: 8px;
    border-right: 1px solid #ddd;
    margin-right: 8px;
}
.code-line {
    display: flex;
    white-space: pre;
}
.code-content {
    flex: 1;
}
`;

interface XmlViewDialogProps {
    open: boolean;
    onClose: () => void;
    xmlUrl: string | null;
    xmlType: string | null;
}

const XmlViewDialog: React.FC<XmlViewDialogProps> = ({ open, onClose, xmlUrl, xmlType }) => {
    const [xmlString, setXmlString] = useState<string | null>(null);
    const [yamlString, setYamlString] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'xml' | 'yaml'>('xml');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [originalFilename, setOriginalFilename] = useState<string | null>(null);
    const [displayFilename, setDisplayFilename] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [matches, setMatches] = useState<number[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
    const codeRef = useRef<HTMLDivElement>(null);

    const fetchAndProcessXml = useCallback(async () => {
        if (!xmlUrl || !open) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setXmlString(null);
        setYamlString(null);
        setOriginalFilename(null);
        setSearchTerm('');
        setMatches([]);
        setCurrentMatchIndex(0);
        // Reset view to XML when new URL is loaded
        setCurrentView('xml');

        try {
            // Download the file directly as a blob
            const response = await fetch(xmlUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Try to get the original filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = null;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // Fallback to URL extraction if header approach fails
            if (!filename) {
                // More robust URL parsing for Azure Blob Storage URLs with SAS tokens
                try {
                    // First try to extract from the rscd parameter which contains the Content-Disposition
                    const urlObj = new URL(xmlUrl);
                    const rscdParam = urlObj.searchParams.get('rscd');

                    if (rscdParam && rscdParam.includes('filename=')) {
                        // Extract filename from the rscd parameter
                        const filenameMatch = rscdParam.match(/filename=([^;]+)/);
                        if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1].replace(/['"]/g, '');
                        }
                    }

                    // If we still don't have a filename, extract from the URL path
                    if (!filename) {
                        // Get the last segment of the path before the query parameters
                        const pathSegments = urlObj.pathname.split('/');
                        filename = pathSegments[pathSegments.length - 1];
                    }
                } catch (error) {
                    // Fallback to the original method if URL parsing fails
                    console.error("Error parsing URL:", error);
                    filename = xmlUrl.split('/').pop()?.split('?')[0] || 'document.xml';
                }
            }

            setOriginalFilename(filename);

            const blob = await response.blob();

            // Read the blob as text
            const reader = new FileReader();
            reader.onload = (e) => {
                const fetchedXmlString = e.target?.result as string;
                setXmlString(fetchedXmlString);

                if (currentView === 'yaml') {
                    try {
                        const jsonObj = xmlJs.xml2json(fetchedXmlString, { compact: true, spaces: 4 });
                        const convertedYaml = yaml.dump(JSON.parse(jsonObj));
                        setYamlString(convertedYaml);
                    } catch (conversionError) {
                        console.error('Error converting XML to YAML:', conversionError);
                        setError('Failed to convert XML to YAML.');
                        setYamlString(null);
                    }
                }
                setIsLoading(false);
            };

            reader.onerror = () => {
                console.error('Error reading file');
                setError('Failed to read XML file.');
                setIsLoading(false);
            };

            reader.readAsText(blob);
        } catch (fetchError) {
            console.error('Error fetching XML:', fetchError);
            setError('Failed to fetch XML content. Please ensure the URL is correct and accessible.');
            setIsLoading(false);
        }
    }, [xmlUrl, open]);

    // Extract useful information from XML content to create a better display name
    const extractInfoFromXml = (xmlContent: string | null): { vesselName: string; portCallId: string } => {
        if (!xmlContent) return { vesselName: '', portCallId: '' };

        let vesselName = '';
        let portCallId = '';

        try {
            // Try standard XML tag extraction first
            const vesselNameMatch = xmlContent.match(/<vesselName[^>]*>(.*?)<\/vesselName>/i) ||
                xmlContent.match(/<VesselName[^>]*>(.*?)<\/VesselName>/i) ||
                xmlContent.match(/<name[^>]*>(.*?)<\/name>/i);

            const portCallIdMatch = xmlContent.match(/<portCallId[^>]*>(.*?)<\/portCallId>/i) ||
                xmlContent.match(/<PortCallId[^>]*>(.*?)<\/PortCallId>/i) ||
                xmlContent.match(/<id[^>]*>(.*?)<\/id>/i);

            if (vesselNameMatch && vesselNameMatch[1]) {
                vesselName = vesselNameMatch[1].trim();
            }

            if (portCallIdMatch && portCallIdMatch[1]) {
                portCallId = portCallIdMatch[1].trim();
            }

            // If standard extraction fails, try parsing the space-separated format
            // Example: "MSGID-3214689 VID 9 1.0 2025-05-16T06:43:55Z DECL-PT-3214689 FI9181106 Eckerö Line Ab Oy AG Eckerö Line Ab Oy..."
            if (!vesselName || !portCallId) {
                // Extract port call ID from MSGID pattern
                const msgIdMatch = xmlContent.match(/MSGID-(\d+)/);
                if (msgIdMatch && msgIdMatch[1]) {
                    portCallId = msgIdMatch[1];
                }

                // Try to find vessel name based on typical patterns
                // Look for lines that might contain vessel name and IMO number
                const lines = xmlContent.split('\n');
                for (const line of lines) {
                    // Check if line has IMO-like number (7 digits) preceded by a word
                    const shipLineMatch = line.match(/(\w[\w\s]+\w)\s+(\d{7})/);
                    if (shipLineMatch && shipLineMatch[1] && shipLineMatch[2]) {
                        vesselName = shipLineMatch[1].trim();
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error extracting information from XML:', error);
        }

        return { vesselName, portCallId };
    };

    const formatDisplayFilename = (filename: string | null, xmlType: string | null, xmlContent: string | null): string => {
        // Default filename based on XML type
        const defaultName = xmlType ? `${xmlType}.xml` : 'document.xml';

        if (!filename) return defaultName;

        // Check if this is a simple XML type filename (VID.xml, ATA.xml, NOA.xml)
        const isSimpleFilename = /^(VID|ATA|NOA)\.xml$/i.test(filename);

        if (isSimpleFilename || filename === defaultName) {
            // For simple filenames, try to extract info from the XML content
            const { vesselName, portCallId } = extractInfoFromXml(xmlContent);

            // Build a more descriptive filename
            let displayName = xmlType || filename.split('.')[0];

            if (vesselName) {
                displayName += ` - ${vesselName}`;
            }

            if (portCallId) {
                displayName += ` (ID: ${portCallId})`;
            }

            return `${displayName}.xml`;
        }

        // For non-simple filenames, use the existing parsing logic
        const nameParts = filename.split('_');

        // Determine the type (ATA, NOA, VID)
        const fileType = xmlType || (nameParts[0] && ['ATA', 'NOA', 'VID'].includes(nameParts[0]) ? nameParts[0] : 'XML');

        // Look for port call ID (typically numeric or with numeric component)
        let portCallId = '';
        let vesselName = '';

        // Extract the vessel name and port call ID from the filename if possible
        if (nameParts.length >= 2) {
            // If the last part contains the extension, remove it
            const lastPart = nameParts[nameParts.length - 1].replace(/\.xml$/i, '');

            // Check if the last part is numeric (likely portCallId)
            if (/^\d+$/.test(lastPart)) {
                portCallId = lastPart;
                // If there are other parts besides the first (type) and last (id),
                // they might constitute the vessel name
                if (nameParts.length > 2) {
                    vesselName = nameParts.slice(1, nameParts.length - 1).join('_');
                }
            } else {
                // Try to find any part that could be a numeric ID
                for (let i = 1; i < nameParts.length; i++) {
                    if (/\d+/.test(nameParts[i])) {
                        portCallId = nameParts[i].replace(/\.xml$/i, '');
                        // Parts before this could be the vessel name
                        if (i > 1) {
                            vesselName = nameParts.slice(1, i).join('_');
                        }
                        break;
                    }
                }

                // If we still don't have a vessel name but have parts, use middle parts
                if (!vesselName && nameParts.length > 2) {
                    vesselName = nameParts.slice(1, -1).join('_');
                }
            }
        }

        // Format the display name
        let displayName = fileType;

        if (vesselName) {
            // Convert underscores back to spaces and capitalize each word
            const formattedVesselName = vesselName
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            displayName += ` - ${formattedVesselName}`;
        }

        if (portCallId) {
            displayName += ` (ID: ${portCallId})`;
        }

        return `${displayName}.xml`;
    };

    useEffect(() => {
        if (open && xmlUrl) {
            fetchAndProcessXml();
        }
    }, [open, xmlUrl, fetchAndProcessXml]);

    // Update display filename when original filename or XML content changes
    useEffect(() => {
        if (originalFilename || xmlString) {
            setDisplayFilename(formatDisplayFilename(originalFilename, xmlType, xmlString));
        } else {
            setDisplayFilename(null);
        }
    }, [originalFilename, xmlType, xmlString]);

    const handleViewChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: 'xml' | 'yaml' | null,
    ) => {
        if (newView !== null) {
            setCurrentView(newView);
            if (newView === 'yaml' && xmlString && !yamlString && !error) {
                setIsLoading(true);
                try {
                    const jsonObj = xmlJs.xml2json(xmlString, { compact: true, spaces: 4 });
                    const convertedYaml = yaml.dump(JSON.parse(jsonObj));
                    setYamlString(convertedYaml);
                } catch (conversionError) {
                    console.error('Error converting XML to YAML:', conversionError);
                    setError('Failed to convert XML to YAML.');
                    setYamlString(null);
                } finally {
                    setIsLoading(false);
                }
            }

            // Reset search when switching views
            setSearchTerm('');
            setMatches([]);
            setCurrentMatchIndex(0);
        }
    };

    const handleDialogClose = () => {
        setIsFullScreen(false);
        onClose();
    };

    const handleDownload = () => {
        if (!xmlString) return;

        // Use the formatted display filename for downloads instead of the original one
        const filename = displayFilename || originalFilename || 'document.xml';

        const blob = new Blob([xmlString], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };

    const handleSearch = useCallback(() => {
        if (!searchTerm || !codeRef.current) return;

        const content = currentView === 'xml' ? xmlString : yamlString;
        if (!content) return;

        // Escape special regex characters in search term
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearchTerm, 'gi');

        // Find all matches
        const newMatches: number[] = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            newMatches.push(match.index);
        }

        setMatches(newMatches);
        setCurrentMatchIndex(newMatches.length > 0 ? 1 : 0);

        // Scroll to first match if any
        if (newMatches.length > 0) {
            setTimeout(() => {
                scrollToMatch(0);
            }, 100);
        }
    }, [searchTerm, xmlString, yamlString, currentView]);

    const scrollToMatch = (matchIndex: number) => {
        if (!codeRef.current || matches.length === 0) return;

        const content = currentView === 'xml' ? xmlString : yamlString;
        if (!content) return;

        // Calculate which line contains the match
        const textBeforeMatch = content.substring(0, matches[matchIndex]);
        const lineNumber = textBeforeMatch.split('\n').length - 1;

        // Find the line element and scroll to it
        const lineElements = codeRef.current.querySelectorAll('.code-line');
        if (lineElements[lineNumber]) {
            lineElements[lineNumber].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const handleNextMatch = () => {
        if (matches.length === 0) return;

        const nextIndex = currentMatchIndex >= matches.length ? 1 : currentMatchIndex + 1;
        setCurrentMatchIndex(nextIndex);
        scrollToMatch(nextIndex - 1);
    };

    const handlePrevMatch = () => {
        if (matches.length === 0) return;

        const prevIndex = currentMatchIndex <= 1 ? matches.length : currentMatchIndex - 1;
        setCurrentMatchIndex(prevIndex);
        scrollToMatch(prevIndex - 1);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setMatches([]);
        setCurrentMatchIndex(0);
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            maxWidth={isFullScreen ? false : "lg"}
            fullWidth
            fullScreen={isFullScreen}
            scroll="paper"
        >
            <style>{styles}</style>
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'white'
                }}
            >
                <Box component="div" sx={{ typography: 'h6' }}>View {xmlType || 'XML'} Document</Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton
                            color="inherit"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            size="small"
                        >
                            {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Close">
                        <IconButton
                            color="inherit"
                            onClick={handleDialogClose}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>
            <DialogContent
                dividers
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 0,
                    height: isFullScreen ? 'calc(100vh - 130px)' : '60vh'
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <ToggleButtonGroup
                        value={currentView}
                        exclusive
                        onChange={handleViewChange}
                        aria-label="XML/YAML view toggle"
                        size="small"
                    >
                        <ToggleButton value="xml" aria-label="View as XML">
                            XML
                        </ToggleButton>
                        <ToggleButton value="yaml" aria-label="View as YAML">
                            YAML
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            placeholder="Search..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {matches.length > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {currentMatchIndex}/{matches.length}
                                                </Typography>
                                            )}
                                            <Tooltip title="Previous match">
                                                <IconButton
                                                    size="small"
                                                    onClick={handlePrevMatch}
                                                    disabled={matches.length === 0}
                                                >
                                                    <ArrowUpwardIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Next match">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleNextMatch}
                                                    disabled={matches.length === 0}
                                                >
                                                    <ArrowDownwardIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Clear search">
                                                <IconButton
                                                    size="small"
                                                    onClick={clearSearch}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ ml: 2, width: 300 }}
                        />
                        <Button size="small" onClick={handleSearch} sx={{ ml: 1 }}>
                            Search
                        </Button>
                    </Box>
                </Box>

                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, flexGrow: 1 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                )}

                {!isLoading && !error && (
                    <Box
                        ref={codeRef}
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            overflow: 'auto',
                            p: 0,
                            flexGrow: 1,
                            bgcolor: '#FAFAFA'
                        }}
                    >
                        {(currentView === 'xml' ? xmlString : yamlString)?.split('\n').map((line, index) => {
                            const highlightedLine = formatLineHighlighting(line, index);
                            return (
                                <div className="code-line" key={index}>
                                    <span className="line-number">{index + 1}</span>
                                    <span
                                        className="code-content"
                                        dangerouslySetInnerHTML={{ __html: highlightedLine }}
                                    />
                                </div>
                            );
                        })}
                    </Box>
                )}

                {!isLoading && !error && !xmlString && currentView === 'xml' && (
                    <Typography sx={{ p: 2 }}>No XML content loaded.</Typography>
                )}
                {!isLoading && !error && !yamlString && currentView === 'yaml' && (
                    <Typography sx={{ p: 2 }}>No YAML content to display. Try converting from XML.</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                <Box>
                    {/*{displayFilename && (*/}
                    {originalFilename && (
                        <Typography variant="body2" color="text.secondary">
                            {/*{displayFilename}*/}
                            {originalFilename}
                        </Typography>
                    )}
                </Box>
                <Box>
                    {xmlString && !error && (
                        <Button
                            onClick={handleDownload}
                            startIcon={<DownloadIcon />}
                            variant="contained"
                            color="primary"
                            size="small"
                        >
                            Download
                        </Button>
                    )}
                    <Button onClick={handleDialogClose} sx={{ ml: 1 }} size="small">
                        Close
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );

    // Function to highlight a single line
    function formatLineHighlighting(line: string, lineIndex: number): string {
        let highlightedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        if (currentView === 'xml') {
            // Highlight XML tags
            highlightedLine = highlightedLine
                // Opening tags
                .replace(/&lt;([\w:\-]+)([^&]*?)&gt;/g,
                    '&lt;<span class="xml-name">$1</span><span class="xml-attr">$2</span>&gt;')
                // Closing tags
                .replace(/&lt;\/(\w+)&gt;/g,
                    '&lt;/<span class="xml-name">$1</span>&gt;')
                // Self-closing tags
                .replace(/&lt;([\w:\-]+)([^&]*?)\/&gt;/g,
                    '&lt;<span class="xml-name">$1</span><span class="xml-attr">$2</span>/&gt;')
                // Attributes
                .replace(/(\s+)([\w:\-]+)=(&quot;|&#039;)(.*?)(\3)/g,
                    '$1<span class="attr-name">$2</span>=<span class="attr-value">$3$4$5</span>');
        } else {
            // YAML highlighting
            highlightedLine = highlightedLine
                // Keys
                .replace(/^(\s*)([\w\-]+):/g,
                    '$1<span class="yaml-key">$2</span>:')
                // Values after colons that aren't objects
                .replace(/:\s+([^{}\[\]]+)$/g,
                    ': <span class="yaml-value">$1</span>');
        }

        // Highlight search matches if any
        if (searchTerm) {
            const escapedSearchTerm = searchTerm
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            const regex = new RegExp(escapedSearchTerm, 'gi');
            highlightedLine = highlightedLine.replace(regex,
                '<span class="search-match">$&</span>');
        }

        return highlightedLine;
    }
};

export default XmlViewDialog;

