import { parse } from 'json2csv';

/**
 * Transforms an array of JSON objects into a CSV string.
 * @param {Array<Object>} data - The dataset to convert.
 * @param {Array<String|Object>} fields - (Optional) List of fields to extract, or customized field maps.
 * @returns {String} The CSV formatted string.
 */
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

/**
 * Utility to attach the proper headers to an Express response to trigger a file download.
 * @param {Response} res - Express response object
 * @param {String} filename - Desired filename (must include .csv)
 * @param {String} csvData - The CSV string content
 */
export const sendCSVDowload = (res, filename, csvData) => {
	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	return res.status(200).send(csvData);
};
