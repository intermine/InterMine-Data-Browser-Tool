import React from 'react'

import { ConstraintServiceContext, useMachineBus } from '../../machineBus'
import { popupDecorator } from '../../utils/storybook'
import { ConstraintPopupCard } from './Constraint'
import { createConstraintMachine } from './createConstraintMachine'
import { SelectPopup } from './SelectPopup'
import { machineStub } from './utils'

export default {
	decorators: [...popupDecorator],
	title: 'Components/Popup Cards/Select',
}

const mockResults = [
	{ item: 'Signal Transduction', count: 5226 },
	{ item: 'Signaling by GPCR', count: 2272 },
	{ item: 'GPCR downstream signaling', count: 2176 },
	{ item: 'Cytokine Signaling in immune system', count: 1393 },
]

const SelectBuilder = ({
	initialState = undefined,
	selectedValues = [],
	availableValues = [],
	machine = null,
}) => {
	const [state, send] = useMachineBus(
		machine ? machine : machineStub(initialState, availableValues, selectedValues)
	)

	return (
		<div css={{ maxWidth: 500, minWidth: 376 }}>
			<ConstraintServiceContext.Provider value={{ state, send }}>
				<ConstraintPopupCard>
					{/* @ts-ignore */}
					<SelectPopup label="Protein Name" />
				</ConstraintPopupCard>
			</ConstraintServiceContext.Provider>
		</div>
	)
}

export const NoValuesFound = () => <SelectBuilder />

export const ConstraintsNotSet = () => (
	<SelectBuilder availableValues={mockResults} initialState="noConstraintsSet" />
)

export const ConstraintsChanged = () => (
	<SelectBuilder
		availableValues={mockResults}
		selectedValues={[mockResults[0].item, mockResults[1].item]}
		initialState="constraintsUpdated"
	/>
)

export const ConstraintsApplied = () => (
	<SelectBuilder
		availableValues={mockResults}
		selectedValues={[mockResults[0].item, mockResults[1].item]}
		initialState="constraintsApplied"
	/>
)

export const Playground = () => (
	<SelectBuilder
		availableValues={mockResults}
		machine={createConstraintMachine({
			id: 'select',
			constraintItemsQuery: {},
			// @ts-ignore
		}).withContext({
			selectedValues: [],
			availableValues: mockResults,
			constraintPath: '',
			constraintItemsQuery: {},
			classView: '',
		})}
	/>
)
