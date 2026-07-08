import { parse } from 'json2csv';

// Transforms an array of JSON objects into a CSV string.
export const generateCSV = (data, fields = null) => {
	try {
		if (!data || data.length === 0) {
			// Return headers only or an empty CSV if no data
			return fields ? parse([], { fields }) : '';
		}

		const options = fields ? { fields } : {};
		return parse(data, options);
	} catch (err) {
		console.error('[CSV Export Error]', err);
		throw new Error('Failed to generate CSV data');
	}
};

// Utility to attach the proper headers to an Express response to trigger a file download.
export const sendCSVDowload = (res, filename, csvData) => {
	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	return res.status(200).send(csvData);
};
