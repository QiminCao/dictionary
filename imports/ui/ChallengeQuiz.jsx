import React from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import Quiz from "./Quiz.jsx";
import { withTracker } from "meteor/react-meteor-data";
import { Games } from "../lib/games.js";

class ChallengeQuiz extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			questionTotal: 10
		};

		this.handleAnswerSelected = this.handleAnswerSelected.bind(this);
	}

	handleAnswerSelected(event) {
		// check whether the answer is correct
		this.setUserAnswer(event.currentTarget.value);
		Meteor.call("clicked.update", this.props.game._id);

		// click times should be 2, but use 1 as the threshold
		if (this.props.clicked === 1) {
			if (this.props.game.questionId < this.state.questionTotal) {
				setTimeout(() => this.setNextQuestion(), 2000);
			} else {
				setTimeout(() => this.setResults(), 300);
			}
		}
	}

	setResults() {
		// update winner
		Meteor.call("game.updateWinner", this.props.game._id);
		// update gama statue
		Meteor.call("game.update", Meteor.userId());
		// update user points
		Meteor.call("user.pointsUpdate", Meteor.userId(), this.props.points);
	}

	setNextQuestion() {
		Meteor.call("questionId.update", this.props.game._id);
		Meteor.call("clicked.reset", this.props.game._id);
		Meteor.call("answer.reset", this.props.game._id);
	}

	setUserAnswer(answer) {
		if (answer === "correct") {
			Meteor.call("points.update", this.props.game._id, Meteor.userId());
		}

		Meteor.call(
			"answer.select",
			this.props.game._id,
			Meteor.userId(),
			answer
		);
	}

	renderQuiz() {
		return (
			<Quiz
				question={
					this.props.game.quiz[this.props.game.counter].question
				}
				questionId={this.props.game.questionId}
				answerOptions={
					this.props.game.quiz[this.props.game.counter].options
				}
				answer={this.props.answer}
				questionTotal={this.state.questionTotal}
				onAnswerSelected={this.handleAnswerSelected}
			/>
		);
	}

	render() {
		return <div>{this.renderQuiz()}</div>;
	}
}

ChallengeQuiz.propTypes = {
	game: PropTypes.object,
	counter: PropTypes.number,
	clicked: PropTypes.number,
	answer: PropTypes.string,
	points: PropTypes.number
};

function answerTracker(game) {
	if (Meteor.userId() == game.p1_profile.userId) {
		return game.p1_profile.answer;
	} else if (Meteor.userId() == game.p2_profile.userId) {
		return game.p2_profile.answer;
	}
}

function pointsTracker(game) {
	if (game !== undefined) {
		if (Meteor.userId() == game.p1_profile.userId) {
			return game.p1_profile.points;
		} else if (Meteor.userId() == game.p2_profile.userId) {
			return game.p2_profile.points;
		}
	}
}

export default withTracker(() => {
	Meteor.subscribe("Games").ready();

	let game = Games.findOne({
		$or: [{ player1: Meteor.userId() }, { player2: Meteor.userId() }]
	});

	return {
		clicked: game.clicked,
		answer: answerTracker(game),
		points: pointsTracker(game)
	};
})(ChallengeQuiz);
