import { connect, find } from "../../../utils/mongo";

/**
 * Refer to https://nextjs.org/docs/api-routes/introduction
 * 
 * This file routes to the endpoint /api/match
 * 
 * Takes in a query and uses it to query MongoDB and returns matching doucments
 */

export default async (req, res) => {
	// Listen for POST request
	if (req.method === "POST") {
		// Get the value
		const value = req.body;

		// Create the query
		const regex = new RegExp(`\\b(${value})`, "i");
		const query = {
			$or: [
				{ "part_of": regex },
				{ "name": regex },
				{ "intro": regex }
			]
		};

		try {
			// Get the docs and return it
			const docs = await queryMatchedDocs(query);

			return res.status(200).json(docs);
		} catch (e) {
			// TODO: Error handling 
			console.log(e);
		}
	} else {
		// TODO: Handle any other requests
	}
}

/**
 * Query db for all matching documents
 * @param {*} query 
 */
async function queryMatchedDocs(query) {
	try {
		// Connect to MongoDB
		const db = await connect();

		// Get every matching document in MongoDB
		const docs = await find(db, query);

		return docs;
	} catch (e) {
		// TODO: Add error handler
		console.log(e);
	}
}