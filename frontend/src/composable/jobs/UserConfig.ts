import { ref, watch } from "vue";
import { queryGql, reportError } from "../api/QueryHandler";
import { useStatusMessage } from "../core/AppState";

import { type Group as FilterGroup } from "@/composable/jobs/FilterGroups";

export const jobUserDisplayConfig = (id: number) => {
    const filter = ref<Record<string, FilterGroup>>({});
    const graph = ref([]);

    watch(filter, (value) => {
        console.debug("ToDo: Filter changed, Sync with  db", value);
    }, { deep: true });

    const loacConfigs = async () => {
        queryGql(`
            { 
            userJobConfig {
                __typename
                ... on Message {
                    message
                    status
                }
                ... on UserJobDisplayConfig {
                    filter
                    graph
                }

            }
        }`).then((response) => {
            switch (response.providedTypes[0]) {
                case "userJobConfig":
                    filter.value = response.data.userJobConfig.filter;
                    graph.value = response.data.userJobConfig.graph;
                    break;
                default:
                    throw response;
            }
        }).catch((error) => {
            reportError(error);
        });
    }

    const comitConfig = async () => {
        queryGql(`
            mutation {
                userJobDisplayConfig(
                    filter: ${JSON.stringify(filter.value)},
                    graph: ${JSON.stringify(graph.value)}
                ) {
                    __typename
                    message
                    status
                }
            }
        `).then((response) => {
            if (response.providedTypes[0] == "Message" && response.data.status === "SUCCESS") {
                useStatusMessage().newStatusMessage(response.data.message, "success");
                return;        
            }
            throw response;
        }).catch((error) => {
            reportError(error);
        });
    }

    return { 
        filter,
        graph,
        loacConfigs,
        comitConfig
    };
}