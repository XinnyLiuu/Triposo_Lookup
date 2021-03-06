import React from 'react';
import SearchCard from "./SearchCard";
import CustomAlert from "./CustomAlert";
import {
	Button,
	Grid,
	TextField,
	withStyles
} from "@material-ui/core";
import Spinner from './Spinner';

const styles = theme => ({
	searchField: {
		width: 300,
		marginRight: 10
	},
	searchButton: {
		marginRight: "5px"
	},
	cardsGrid: {
		width: "unset",
		margin: "unset",
		[theme.breakpoints.down('sm')]: {
			flexDirection: "column",
			alignItems: "center",
			width: "100%"
		}
	},
	card: {
		[theme.breakpoints.down('sm')]: {
			minWidth: "350px"
		}
	}
});

/**
 * Refer to https://material-ui.com/components/autocomplete/
 */

class Search extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			searchValue: "",
			searchResults: "",
			showSpinner: false,
			noResults: false,
			error: false
		}

		// Bind, "this" for handle methods
		this.handleSearchButtonOnClick = this.handleSearchButtonOnClick.bind(this);
		this.handleTextFieldOnChange = this.handleTextFieldOnChange.bind(this);
		this.handleLocationButtonOnClick = this.handleLocationButtonOnClick.bind(this);
	}

	/**
	 * Calls a GET request to /api/location/match
	 */
	async fetchMatchingData(value) {
		try {
			const resp = await fetch(process.env.post_location_by_match_api, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"value": value
				})
			});

			// Check the status of the resp
			if (resp.status === 200) {
				const data = await resp.json();

				if (data.length > 0) {
					this.setState({
						searchResults: data,
						showSpinner: false
					})
				} else {
					this.setState({
						noResults: true,
						showSpinner: false
					})
				}
			}

			if (resp.status === 500) throw new Error();
		} catch (e) {
			this.setState({
				error: true
			});
		}
	}

	/**
	 * Calls a GET request to /api/location/nearby
	 */
	async fetchNearbyData(coords) {
		try {
			const resp = await fetch(process.env.post_location_by_nearby_api, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"coords": coords
				})
			});

			// Check the status of the resp
			if (resp.status === 200) {
				const data = await resp.json();

				if (data.length > 0) {
					this.setState({
						searchResults: data,
						showSpinner: false
					})
				} else {
					this.setState({
						noResults: true,
						showSpinner: false
					})
				}
			}

			if (resp.status === 500) throw new Error();
		} catch (e) {
			this.setState({
				error: true
			});
		}
	}

	/**
	 * Handles the search button on click
	 */
	handleSearchButtonOnClick() {
		// Get the value and query the database for any documents that has it. ie.) “Foo”, should find “Food” or “Work” should find “Working”, but not “rework”
		if (this.state.searchValue !== "" || localStorage.getItem("searchValue") !== "") {
			this.setState({
				showSpinner: true, // Show the spinner
				searchResults: "", // Get rid of any prior stored results data
				noResults: false,
			});

			localStorage.setItem("searchValue", this.state.searchValue.trim());

			// Get data
			this.fetchMatchingData(this.state.searchValue.trim());
		}
	}

	/**
	 * Handles the location button on click
	 */
	handleLocationButtonOnClick() {
		if ("location" in this.props) {
			// Get the coordinates of the user
			const location = this.props.location;

			const lat = location.latitude;
			const long = location.longitude;

			const coords = {
				lat: lat,
				long: long
			};

			this.setState({
				showSpinner: true,
				searchValue: ""
			});

			localStorage.setItem("searchValue", "");

			// Get data nearby the specified location
			this.fetchNearbyData(coords);
		}
	}

	/**
	 * Handles the text field on change
	 */
	handleTextFieldOnChange(e) {
		this.setState({
			searchValue: e.target.value,
			searchResults: "",
			noResults: false
		});

		localStorage.setItem("searchValue", e.target.value.trim());
	}

	componentDidMount() {
		// Check if a search value has been queried before
		if (localStorage.getItem("searchValue") !== "" && localStorage.getItem("searchValue") !== null) {
			this.setState({
				showSpinner: true,
				searchValue: localStorage.getItem("searchValue")
			}, () => {
				this.fetchMatchingData(this.state.searchValue);
			});
		}
	}

	render() {
		// Get the styles from makeStyles hook	
		const classes = this.props.classes;

		// Build the search form
		const searchForm = (
			<Grid container direction="column" justify="center" alignItems="center">
				<Grid item className={classes.searchField}>
					<TextField label="Search a String (US Locations)" margin="normal" fullWidth type="search" value={this.state.searchValue} variant="outlined" onChange={this.handleTextFieldOnChange} />
				</Grid>
				<Grid item>
					<Button variant="contained" color="primary" onClick={this.handleSearchButtonOnClick} className={classes.searchButton}>
						Search
					</Button>
					<Button variant="outlined" color="primary" onClick={this.handleLocationButtonOnClick}>
						Locate
					</Button>
				</Grid>
			</Grid>
		);

		// Check if spinner is toggled
		if (this.state.showSpinner) {
			return (
				<React.Fragment>
					{searchForm}
					<Spinner />
				</React.Fragment>
			)
		}

		// Check if an error is thrown
		if (this.state.error) return <CustomAlert severity="error" title="An error has occurred!" message="There was an error processing your request. Please try again later." />;

		// Check if no results are found
		if (this.state.noResults) {
			return (
				<React.Fragment>
					{searchForm}
					<CustomAlert severity="warning" title="No Results" message="No locations have been found based on your input." />
				</React.Fragment>
			);
		}

		// Check if there are search results 
		if (this.state.searchResults !== "") {
			// Iterate through each search result and build the grid of search cards
			const results = this.state.searchResults;
			results.sort((a, b) => a.name.localeCompare(b.name));
			const cards = [];

			// Highlight the searched word in the results
			const keyword = this.state.searchValue;

			if (keyword !== "") {
				for (const r of results) {
					const intro = r.intro.toLowerCase();

					if (intro.includes(keyword)) {
						const start = intro.indexOf(keyword);
						const end = start + keyword.length;

						r.intro = [r.intro.slice(0, start - 1), '&lt;strong&gt;', r.intro.slice(start, end), '&lt;/strong&gt;', r.intro.slice(end, intro.length)].join(" ").trim();
					}
				}
			}

			// Create the GUI for each result
			for (const r of results) {
				cards.push(
					<Grid item xs={4} className={classes.card}>
						<SearchCard name={r.name} intro={r.intro} id={r._id} state={r.part_of[0]} />
					</Grid>
				)
			}

			return (
				<React.Fragment>
					{searchForm}
					<div style={{ flexGrow: 1 }}>
						<Grid container spacing={3} className={classes.cardsGrid}>
							{cards}
						</Grid>
					</div>
				</React.Fragment>
			)
		}

		return searchForm;
	}
}

export default withStyles(styles)(Search);