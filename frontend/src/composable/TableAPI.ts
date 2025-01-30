import { ref, type Ref} from 'vue';
import { useStatusMessage } from './AppState';
const API_ENDPOINT = "/api/";

export interface TableMetaData {
    id: number;
    label: string;
    script: string;
    description: string;
    created_at: string;
}

// [column name, column type]
export type TableLayout = [string, string][];

let localTableMetaData: Ref<TableMetaData[]> = ref([]);

export function useTableMetaData() {

    const fetchTableMetaData = () => {
        new Promise<TableMetaData[]>(async (resolve, reject) => {
            const response = await fetch(API_ENDPOINT);
            await response.json()
                .catch(reject)
                .then((data: TableMetaData[]) => {
                    resolve(data);
                }
            )
        }).then((data) => {
            localTableMetaData.value = data;
        }).catch(() => {
            console.error("Failed to fetch table metadata");
            useStatusMessage().newStatusMessage("Using test data", "danger");
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

export function useTableData(activeTable: number) {
    // Thes varaiables are local to one components instance
    let tableLayout = ref<TableLayout>([]);
    let tableData = ref<any[]>([]);

    const fetchTableLayout = () => {
        return new Promise(async (resolve, reject) => {
            console.debug("Fetching table layout " + activeTable);
            const response = await fetch(`${API_ENDPOINT}tableLayout?id=${activeTable}`);
            await response.json()
                .catch(reject)
                .then((data: TableLayout) => {
                    resolve(data);
                }
            )
        }).then((data) => {
            console.error("SUS");
            tableLayout.value = data as TableLayout;
        }).catch(() => {
            console.debug("USING TEST DATA");
            tableLayout.value = [
                ["Column 1", "string"],
                ["Column 2", "number"]
            ]
        });
    }

    const getTableLayout = (): TableLayout => {
        if (tableLayout.value.length === 0) {
            fetchTableLayout().then(() => {
                console.info("Table layout fetched");
            });
        }
        return tableLayout.value;
    }

    const getLocalData = (datarange: [number, number] | undefined = undefined) => {
        if (datarange) {
            console.log(tableData.value.slice(datarange[0], datarange[1]));
            return tableData.value.slice(datarange[0], datarange[1]+1);
        }
        return tableData.value;
    }
    
    const fetchNextEntrys = async (length: number) => {
        let start_pos = tableData.value.length;
        await fetch(`${API_ENDPOINT}tableData?id=${activeTable}&start_pos=${start_pos}&length=${length}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch table data");
                }
                return response.json();
            })
            .then((data) => {
                tableData.value.push(data); // Assuming `data` is in the correct format for `tableData`
            })
            .catch((error) => {
                console.error("Failed to fetch table data:", error);
                useStatusMessage().newStatusMessage("Using test data", "danger");
                let MAX_POS = 10;
                for (let i = 0; i < length; i++) {
                    if (start_pos + i > MAX_POS) {
                        break;
                    }
                    tableData.value.push({
                        "Column 1": `Test ${start_pos + i}`,
                        "Column 2": start_pos + i
                    });
                }
            });
            console.log("Fetching next entries");
        console.log(tableData.value.slice(start_pos, start_pos + length));
        return tableData.value.slice(start_pos, start_pos + length);
    };

    return {
        getTableLayout,
        getLocalData,
        fetchNextEntrys,
    }
}


// This is not good practice, but itll work for now
useTableMetaData().fetchTableMetaData();