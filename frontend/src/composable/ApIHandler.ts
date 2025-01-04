import { ref, type Ref, onMounted} from 'vue';
import { useStatusMessage } from './AppState';
const API_ENDPOINT = "/api/";

interface TableMetaData {
    id: number;
    label: string;
    script: string;
    description: string;
    created_at: string;
}

let localTableMetaData: Ref<TableMetaData[]> = ref([]);



export function useTableMetaData() {

    const fetchTableMetaData = () => {
        new Promise<TableMetaData[]>(async (resolve, reject) => {
            const response = await fetch(API_ENDPOINT);
            const data = await response.json()
                .catch(reject)
                .then((data: TableMetaData[]) => {
                    resolve(data);
                }
            )
        }).then((data) => {
            localTableMetaData.value = data;
        }).catch(() => {
            console.error("Failed to fetch table metadata");
            useStatusMessage().setState("Using Test Data");
            localTableMetaData.value = [
                {
                    id: 1,
                    label: "Test Table",
                    script: "some.py",
                    description: "This is a test table",
                    created_at: "2021-10-10"
                },
                {
                    id: 2,
                    label: "Test Table 2",
                    script: "some.py",
                    description: "This is a test table 2",
                    created_at: "2021-10-10"
                }
            ]
        });
    }

    const getTaleMetaData = (id: number|undefined) => {
        return !id ? localTableMetaData.value : localTableMetaData.value.find((table) => table.id === id);
    }

    const updateTableMetaData = (data: TableMetaData) => {
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(() => {
            let modifiedTable = localTableMetaData.value.find((table) => table.id === data.id)
            if (!modifiedTable) {
                // If the update on the db was successful, but the local data is not found, we need to fetch the data again
                fetchTableMetaData();
            }
            localTableMetaData.value.splice(localTableMetaData.value.indexOf(modifiedTable as TableMetaData), 1, data);
        })
    }

    return { 
        fetchTableMetaData,
        getTaleMetaData,
        updateTableMetaData,
        localTableMetaData
     }
    
}

// This is not good practice, but itll work for now
useTableMetaData().fetchTableMetaData();
