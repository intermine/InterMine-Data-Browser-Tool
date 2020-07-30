import { Button, Divider, H4, H5, NonIdealState } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import PropTypes from 'prop-types'
import React from 'react'
import {
	DELETE_QUERY_CONSTRAINT,
	FETCH_UPDATED_SUMMARY,
	REMOVE_LIST_CONSTRAINT,
} from 'src/eventConstants'
import { QueryServiceContext, sendToBus, useMachineBus } from 'src/machineBus'

import { CODES } from '../common'
import { RunQueryButton } from '../Shared/Buttons'
import { NonIdealStateWarning } from '../Shared/NonIdealStates'
import { PopupCard } from '../Shared/PopupCard'
import { queryControllerMachine } from './queryControllerMachine'

const getOperantSymbol = (operant) => {
	switch (operant) {
		case 'ONE OF':
			return '='
		default:
			return ''
	}
}

const CurrentConstraints = ({ constraints, handleDeleteConstraint }) => {
	if (constraints.length === 0) {
		return (
			<NonIdealStateWarning
				title="No Constraints applied"
				description="Displaying default results for the current mine"
			/>
		)
	}

	return (
		<ul css={{ padding: '0 16px', listStyle: 'none' }}>
			{constraints.flatMap((constraintConfig) => {
				return (
					<li key={constraintConfig.path} css={{ padding: '6px 0' }}>
						<div css={{ display: 'flex' }}>
							<Button
								intent="danger"
								icon={IconNames.REMOVE}
								small={true}
								minimal={true}
								onClick={() => handleDeleteConstraint(constraintConfig.path)}
								aria-label={`reset constraint ${constraintConfig.path.replace(/\./g, ' ')}`}
								css={{ marginRight: 4 }}
							/>
							<span css={{ fontSize: 'var(--fs-desktopM1)', display: 'inline-block' }}>
								{constraintConfig.path}
							</span>
						</div>
						<ul css={{ listStyle: 'none', paddingLeft: 36 }}>
							{constraintConfig.valuesDescription.map((value) => {
								return (
									<li key={value.item}>{`${getOperantSymbol(constraintConfig.op)} ${value.item} (${
										value.count
									})`}</li>
								)
							})}
						</ul>
					</li>
				)
			})}
		</ul>
	)
}

CurrentConstraints.propTypes = {
	currentConstraints: PropTypes.array,
	sendMsg: PropTypes.func,
}

CurrentConstraints.defaultProps = {
	currentConstraints: [],
}

const ListContraintValues = ({ values, handleDeleteListConstraint }) => {
	return (
		<ul css={{ padding: '0 16px', listStyle: 'none' }}>
			{values.map((value) => {
				return (
					<li key={value} css={{ padding: '6px 0' }}>
						<div css={{ display: 'flex' }}>
							<Button
								intent="danger"
								icon={IconNames.REMOVE}
								small={true}
								minimal={true}
								onClick={() => handleDeleteListConstraint(value)}
								aria-label={`delete ${value} from the list constraint`}
								css={{ marginRight: 4 }}
							/>
							<span css={{ fontSize: 'var(--fs-desktopM1)', display: 'inline-block' }}>
								{value}
							</span>
						</div>
					</li>
				)
			})}
		</ul>
	)
}

export const QueryController = () => {
	const [state, send] = useMachineBus(queryControllerMachine)

	const { currentConstraints, classView, selectedPaths, rootUrl, listConstraint } = state.context

	let color = 'var(--green5)'

	if (currentConstraints.length === 26) {
		color = 'var(--red5)'
	} else if (currentConstraints.length > 14) {
		color = 'var(--yellow5)'
	}

	const runQuery = () => {
		let constraintLogic = ''

		const codedConstraints = currentConstraints.map((con, idx) => {
			const code = CODES[idx]
			constraintLogic = constraintLogic === '' ? `(${code})` : `${constraintLogic} AND (${code})`

			return {
				...con,
				code,
			}
		})

		const query = {
			from: classView,
			select: selectedPaths,
			constraintLogic,
			where: codedConstraints,
		}

		sendToBus({ type: FETCH_UPDATED_SUMMARY, query, globalConfig: { classView, rootUrl } })
	}

	const handleDeleteConstraint = (path) => {
		send({ type: DELETE_QUERY_CONSTRAINT, path })
	}

	const handleDeleteListConstraint = (listName) => {
		// @ts-ignore
		sendToBus({ type: REMOVE_LIST_CONSTRAINT, listName })
	}

	const constraintCount = currentConstraints.length + listConstraint.values.length

	return (
		<div css={{ paddingTop: 10, margin: '0 20px' }}>
			<H5>
				<span css={{ color, display: 'inline-block', marginRight: 4 }}>{`${constraintCount}`}</span>
				<span css={{ color: 'var(--blue9)' }}>Constraints applied</span>
			</H5>
			<PopupCard>
				<Button text="view all" intent="primary" fill={true} icon={IconNames.EYE_OPEN} />
				<QueryServiceContext.Provider value={{ state, send }}>
					<H4>Current</H4>
					<CurrentConstraints
						constraints={currentConstraints}
						handleDeleteConstraint={handleDeleteConstraint}
					/>
					<Divider css={{ width: '75%', marginBottom: 16 }} />
					<H4>Lists</H4>
					<ListContraintValues
						values={listConstraint.values}
						handleDeleteListConstraint={handleDeleteListConstraint}
					/>
					<Divider css={{ width: '75%', marginBottom: 16 }} />
					<H4>History</H4>
					<NonIdealState
						title="You have no historical queries"
						icon={IconNames.INFO_SIGN}
						css={{ paddingBottom: 32, borderRadius: 3 }}
					/>
				</QueryServiceContext.Provider>
			</PopupCard>
			<RunQueryButton
				intent={currentConstraints.length === 0 ? 'none' : 'success'}
				isDisabled={currentConstraints.length === 0}
				handleOnClick={runQuery}
			/>
		</div>
	)
}