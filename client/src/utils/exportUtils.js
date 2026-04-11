/**
 * Downloads a Blob dataset automatically onto the user's client machine.
 * 
 * @param {Blob|Response|string} data - The raw blob data, axios response, or string to download.
 * @param {string} filename - The target filename to trigger download as (e.g., "export.csv")
 * @param {string} mimeType - The MIME type of the file. Defaults to 'text/csv;charset=utf-8;'
 */
export const downloadFile = (data, filename = 'export.csv', mimeType = 'text/csv;charset=utf-8;') => {
	try {
        // If the data is an Axios response containing a blob or string
		let fileData = data;
		if (data && typeof data === 'object' && data.data) {
			fileData = data.data;
		}

		const blob = new Blob([fileData], { type: mimeType });
		const url = window.URL.createObjectURL(blob);
		
        const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
        
        // Clean up memory
		setTimeout(() => {
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		}, 100);
	} catch (err) {
		console.error('[ExportUtil] Error triggering file download:', err);
		throw err;
	}
};
