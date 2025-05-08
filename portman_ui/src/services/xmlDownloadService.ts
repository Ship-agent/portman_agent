import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071/api';

export const xmlDownloadService = {
    /**
     * Get a download URL for an XML file
     * @param blobName The name of the blob to download
     * @returns A promise that resolves to the download URL
     */
    getDownloadUrl: async (blobName: string): Promise<string> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/xml-download`, {
                params: { blob_name: blobName }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting download URL:', error);
            throw error;
        }
    },

    /**
     * Download an XML file
     * @param blobName The name of the blob to download
     */
    downloadXml: async (blobName: string): Promise<void> => {
        try {
            const downloadUrl = await xmlDownloadService.getDownloadUrl(blobName);
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Error downloading XML:', error);
            throw error;
        }
    }
};
