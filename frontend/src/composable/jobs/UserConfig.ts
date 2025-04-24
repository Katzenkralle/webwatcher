import { computed, ref, watch } from "vue";
import { queryGql, reportError } from "../api/QueryHandler";
import { useStatusMessage } from "../core/AppState";

import { type Group as FilterGroup } from "@/composable/jobs/FilterGroups";
import { type GraphDataSeries } from "@/composable/jobs/GraphDataHandler";

export interface GraphConfig {
    name: string;
    data: GraphDataSeries; 
}

export interface SaveUserConfig {
    filterConfig?: string;
    graphConfig?: string;
    hiddenCols?: string;
}

export const jobUserDisplayConfig = (id: number) => {
    const baseFilter = ref<Record<string, FilterGroup>>({});
    const baseGraph = ref<GraphConfig[]>([]);
    const baseHiddenCols = ref<string[]|undefined>(undefined);

    const hasQueryedOnce: string[] = []

    const getRemoteStateHiddenCols = async () => {
        if (!hasQueryedOnce.includes('hiddenCols')) {
            await loadConfig()
            hasQueryedOnce.push('hiddenCols');
        }
        return baseHiddenCols.value;
    }

    const filter = computed({
        async get() {
            if(Object.keys(baseFilter.value).length === 0
                && !hasQueryedOnce.includes('filter')) {
                await loadConfig();
                hasQueryedOnce.push('filter');
            }
            return baseFilter.value;
        },
        set(value: {delete?: string[], 
            add?: Record<string, FilterGroup>,
            replace?: Record<string, FilterGroup>}) {
            let newConfig = value.replace ?? {...baseFilter.value, ...value.add ?? {}};
            if (value.delete) {
                for (let key of value.delete) {
                    delete newConfig[key];
                }
            }
            comitConfig({filterConfig: JSON.stringify(newConfig)});
            baseFilter.value = newConfig;
        }
    });

    const graph = computed({
        async get() {
            if(Object.keys(baseGraph.value).length === 0
                && !hasQueryedOnce.includes('graph')) {
                await loadConfig();
                hasQueryedOnce.push('graph');
            }
            return baseGraph.value;
        },
        set(value: {delete?: (string|number)[], 
            add?: GraphConfig[],
            change?: {index: number, value: GraphConfig},
            replace?: GraphConfig[]}) {
            let newConfig = value.replace ?? [...baseGraph.value, ...value.add ?? []];
            if (value.delete) {
                for (let key of value.delete) {
                    if (typeof key === 'string') {
                        newConfig = newConfig.filter((item) => item.name !== key);
                    } else {
                        newConfig.splice(key, 1);
                    }   
                }
            }
            if (value.change) {
                newConfig[value.change.index] = value.change.value;
            }
            comitConfig({graphConfig: JSON.stringify(newConfig)});
            baseGraph.value = newConfig;
        }
    });

    let loadPromise: Promise<void> | null = null;
    const loadConfig = async () => {
        if (!loadPromise) {
            loadPromise = loadConfigQuery()
        }
        return loadPromise;
    }

    const loadConfigQuery = async () => {
        const query = `
            query updateUserJobConfig($id: Int!) { 
            userJobConfig(id: $id) {
                ... on UserDisplayConfig {
                __typename
                filterConfig
                graphConfig
                hiddenColsConfig
                }
                ... on Message {
                __typename
                message
                status
                }
            }
        }`
        
        await queryGql(query, {id: id}).then((response) => {
            switch (response.providedTypes[0].type) {
                case "UserDisplayConfig":
                    baseFilter.value = response.data.userJobConfig.filterConfig ? JSON.parse(response.data.userJobConfig.filterConfig) : {};
                    baseGraph.value = response.data.userJobConfig.graphConfig ? JSON.parse(response.data.userJobConfig.graphConfig) : [];
                    baseHiddenCols.value = response.data.userJobConfig.hiddenColsConfig ? JSON.parse(response.data.userJobConfig.hiddenColsConfig) : undefined;
                    break;
                default:
                    throw response;
            }
        }).catch((error) => {
            reportError(error);
        });
    }

    const comitConfig = async (newState: SaveUserConfig) => {
        queryGql(`
            mutation UpdateUserJobConfig($id: Int!, $graphConfig: JsonStr, $filterConfig: JsonStr, $hiddenCols: JsonStr) {
                userJobConfig(
                    id: $id,
                    graphConfig: $graphConfig,
                    filterConfig: $filterConfig,
                    hiddenColsConfig: $hiddenCols
                ) {
                    __typename
                    message
                    status
                }
            }
        `, {id: id, ...newState}).then((response) => {
            if (response.providedTypes[0].type !== "Message" || response.data.userJobConfig.status !== "SUCCESS") {
                throw response;        
            }
        }).catch((error) => {
            reportError(error);
        });
    }

    return { 
        filter,
        graph,
        getRemoteStateHiddenCols,
        loadConfig,
        comitConfig
    };
}