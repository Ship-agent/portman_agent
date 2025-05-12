import React, { useState } from 'react';
import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { xmlDownloadService } from '../../services/xmlDownloadService';

interface XmlDownloadButtonProps {
    blobName: string;
    label?: string;
    disabled?: boolean;
}

export const XmlDownloadButton: React.FC<XmlDownloadButtonProps> = ({
    blobName,
    label = 'Download XML',
    disabled = false
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsLoading(true);
            await xmlDownloadService.downloadXml(blobName);
        } catch (error) {
            console.error('Download failed:', error);
            // You might want to show an error message to the user here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={disabled || isLoading}
        >
            {isLoading ? 'Downloading...' : label}
        </Button>
    );
}; 