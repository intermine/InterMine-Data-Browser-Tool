import hash from 'object-hash'
import { fetchClasses, fetchInstances, fetchLists, INTERMINE_REGISTRY } from 'src/apiRequests'
import { interminesConfigCache } from 'src/caches'
import { DEFAULT_VIEW } from 'src/constants'
import {
	CHANGE_CLASS,
	CHANGE_MINE,
	FETCH_DEFAULT_SUMMARY,
	RESET_PLOTS_TO_DEFAULT,
	SET_API_TOKEN,
	TOGGLE_VIEW,
} from 'src/eventConstants'
import { sendToBus } from 'src/useEventBus'
import { assign, Machine, spawn } from 'xstate'

import { QueryControllerMachine } from '../QueryController/QueryControllerMachine'
import {
	interminesConfig,
	listsConfig,
	maybeFetchPromise,
	modelClassesConfig,
} from './fetchMineConfigUtils'
import { OverviewTabMachine } from './OverviewTabMachine'
import { TemplateViewTabMachine } from './TemplateViewTabMachine'

// Todo: Change this after fixing biotestmine dev environment
const isProduction = true

/**
 *
 */
const changeMine = assign({
	// @ts-ignore
	selectedMine: (ctx, { newMine }) => ctx.intermines.find((mine) => mine.name === newMine),
	// Reset the class
	classView: () => 'Gene',
})

/**
 *
 */
const changeClass = assign({
	// @ts-ignore
	classView: (_, { newClass }) => newClass,
})

/**
 *
 */
const setMineConfiguration = assign({
	// @ts-ignore
	intermines: (_, { data }) => data.intermines,
	// @ts-ignore
	modelClasses: (_, { data }) => data.modelClasses,
	// @ts-ignore
	lists: (_, { data }) => data.lists,
})

/**
 *
 */
const filterListsForClass = assign({
	listsForCurrentClass: (ctx) => {
		/**
		 * Lists are a class instance, and can't be cloned when building the search index
		 * in a service worker. So we have to extract the values we need, namely just the name
		 * and description
		 */
		return ctx.lists.flatMap((list) => {
			if (list.type !== ctx.classView) {
				return []
			}

			return [
				{
					listName: list.name,
					displayName: list.name.replace(/_/g, ' ').replace(/:/g, ': '),
					description: list.description,
				},
			]
		})
	},
})

/**
 *
 */
const setApiToken = assign({
	// @ts-ignore
	selectedMine: (ctx, { apiToken }) => {
		localStorage.setItem(`apiToken-${ctx.selectedMine.rootUrl}`, apiToken)

		return {
			...ctx.selectedMine,
			apiToken,
		}
	},
})

/**
 *
 */
const getApiTokenFromStorage = assign({
	selectedMine: (ctx) => {
		const apiToken = localStorage.getItem(`apiToken-${ctx.selectedMine.rootUrl}`) ?? ''

		return {
			...ctx.selectedMine,
			apiToken,
		}
	},
})

/**
 *
 */
const setAppView = assign({
	// @ts-ignore
	appView: (_, { newTabId }) => newTabId,
})

/**
 *
 */
const spawnTemplateViewMachine = assign({
	viewActors: (ctx) => {
		if (ctx.viewActors.templateView) {
			ctx.viewActors.templateView.stop()
		}

		const actor = TemplateViewTabMachine.withContext({
			...TemplateViewTabMachine.context,
			classView: ctx.classView,
			rootUrl: ctx.selectedMine.rootUrl,
			showAllLabel: ctx.showAllLabel,
			mineName: ctx.selectedMine.name,
		})

		return {
			...ctx.viewActors,
			templateView: spawn(actor, 'Template view'),
		}
	},
})

/**
 *
 */
const spawnOverviewMachine = assign({
	viewActors: (ctx) => {
		if (ctx.viewActors.overview) {
			ctx.viewActors.overview.stop()
		}

		const actor = OverviewTabMachine.withContext({
			...OverviewTabMachine.context,
			classView: ctx.classView,
			rootUrl: ctx.selectedMine.rootUrl,
		})

		return {
			...ctx.viewActors,
			overview: spawn(actor, 'Overview'),
		}
	},
})

/**
 *
 */
const spawnQueryControllerMachine = assign({
	viewActors: (ctx) => {
		if (ctx.viewActors.queryController) {
			ctx.viewActors.queryController.stop()
		}

		const actor = QueryControllerMachine.withContext({
			...QueryControllerMachine.context,
			classView: ctx.classView,
			rootUrl: ctx.selectedMine.rootUrl,
		})

		return {
			...ctx.viewActors,
			queryController: spawn(actor, 'Query controller'),
		}
	},
})

/**
 *
 */
const fetchInitialSummaryForMine = (ctx) => {
	sendToBus({ type: RESET_PLOTS_TO_DEFAULT })

	sendToBus({
		type: FETCH_DEFAULT_SUMMARY,
		classView: ctx.classView,
		rootUrl: ctx.selectedMine.rootUrl,
	})
}

/**
 *
 */
const stopAllActors = assign({
	viewActors: (ctx) => {
		const { templateView, overview, queryController } = ctx.viewActors

		templateView && templateView.stop()
		overview && overview.stop()
		queryController && queryController.stop()

		return {
			templateView: null,
			overview: null,
			queryController: null,
		}
	},
})

/**
 *
 */
const logErrorToConsole = (ctx, event) => {
	console.error('FETCH: could not retrieve intermines', { ctx, event })
}

/**
 *
 */
const assignAppView = assign({
	// @ts-ignore
	appView: (_, { newTabId }) => newTabId,
})

/**
 *
 */
const resetCharts = () => {
	sendToBus({ type: RESET_PLOTS_TO_DEFAULT })
}

/**
 * Services
 */
const fetchMineConfiguration = async (ctx) => {
	const rootUrl = ctx.selectedMine.rootUrl
	const registry = INTERMINE_REGISTRY

	const registryStorageConfig = { name: 'instances', registry }
	const registryHash = hash(registryStorageConfig)

	const modelsStorageConfig = { name: 'mine classes', rootUrl }
	const modelsHash = hash(modelsStorageConfig)

	const listsStorageConfig = { name: 'mine lists', rootUrl }
	const listsHash = hash(listsStorageConfig)

	const cachedIntermines = await interminesConfigCache.getItem(registryHash)
	const cachedModelClasses = await interminesConfigCache.getItem(modelsHash)
	const cachedLists = await interminesConfigCache.getItem(listsHash)

	let [resolvedIntermines, resolvedClasses, resolvedLists] = await Promise.all([
		maybeFetchPromise(cachedIntermines?.intermines, () => fetchInstances(registry)),
		maybeFetchPromise(cachedModelClasses?.modelClasses, () => fetchClasses(rootUrl)),
		maybeFetchPromise(cachedLists?.lists, () => fetchLists(rootUrl)),
	])

	const dateSaved = Date.now()

	if (!cachedIntermines) {
		resolvedIntermines = interminesConfig(resolvedIntermines)

		await interminesConfigCache.setItem(registryHash, {
			...registryStorageConfig,
			intermines: resolvedIntermines,
			date: dateSaved,
		})
	}

	if (!cachedModelClasses) {
		resolvedClasses = modelClassesConfig(resolvedClasses)

		await interminesConfigCache.setItem(modelsHash, {
			...modelsStorageConfig,
			modelClasses: resolvedClasses,
			date: dateSaved,
		})
	}

	if (!cachedLists) {
		resolvedLists = listsConfig(resolvedLists)

		await interminesConfigCache.setItem(listsHash, {
			...listsStorageConfig,
			lists: resolvedLists,
			date: dateSaved,
		})
	}

	return {
		modelClasses: resolvedClasses,
		lists: resolvedLists,
		intermines: resolvedIntermines,
	}
}

export const appManagerMachine = Machine(
	{
		id: 'App Manager',
		initial: 'loading',
		context: {
			viewActors: {
				templateView: null,
				overview: null,
				queryController: null,
			},
			appView: DEFAULT_VIEW,
			classView: 'Gene',
			intermines: [],
			modelClasses: [],
			lists: [],
			listsForCurrentClass: [],
			listConstraint: {
				path: 'Gene',
				op: 'IN',
				values: [],
			},
			showAllLabel: 'Show All',
			selectedMine: {
				apiToken: '',
				name: isProduction ? 'HumanMine' : 'biotestmine',
				rootUrl: isProduction
					? 'https://www.humanmine.org/humanmine'
					: 'http://localhost:9999/biotestmine',
			},
		},
		on: {
			[TOGGLE_VIEW]: { actions: 'assignAppView' },
			[CHANGE_MINE]: {
				target: 'loading',
				actions: ['resetCharts', 'changeMine', 'stopAllActors', 'getApiTokenFromStorage'],
			},
			[CHANGE_CLASS]: {
				actions: [
					'changeClass',
					'spawnOverviewMachine',
					'spawnTemplateViewMachine',
					'spawnQueryControllerMachine',
					'fetchInitialSummaryForMine',
				],
			},
			[SET_API_TOKEN]: { actions: 'setApiToken' },
		},
		states: {
			idle: {},
			invalidAppView: {},
			loading: {
				invoke: {
					id: 'fetchMineConfig',
					src: 'fetchMineConfiguration',
					onDone: {
						target: 'idle',
						actions: [
							'setMineConfiguration',
							'filterListsForClass',
							'spawnOverviewMachine',
							'spawnTemplateViewMachine',
							'spawnQueryControllerMachine',
							'fetchInitialSummaryForMine',
						],
					},
					onError: {
						target: 'invalidAppView',
						actions: 'logErrorToConsole',
					},
				},
			},
		},
	},
	{
		actions: {
			changeMine,
			changeClass,
			setMineConfiguration,
			filterListsForClass,
			setApiToken,
			getApiTokenFromStorage,
			logErrorToConsole,
			spawnTemplateViewMachine,
			spawnOverviewMachine,
			spawnQueryControllerMachine,
			setAppView,
			fetchInitialSummaryForMine,
			stopAllActors,
			assignAppView,
			resetCharts,
		},
		services: {
			fetchMineConfiguration,
		},
	}
)
