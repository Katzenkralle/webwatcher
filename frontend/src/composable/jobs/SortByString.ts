import type { flattendJobEnty } from "./JobDataHandler"
import type { TableLayout }from '@/composable/jobs/JobMetaAPI'

export interface sortByString {
    key: string
    ignoreColumns: string[]
    caseInsensitive: boolean
  }
  
export interface HighlightSubstring {
    start: number
    end: number
  }

function longestCommonSubstring(
  input: string,
  target: string,
  caseSensitive: boolean = false,
): HighlightSubstring[] {
  let matches: HighlightSubstring[] = [{ start: 0, end: 0 }]
  if (!caseSensitive) {
    input = input.toLowerCase()
    target = target.toLowerCase()
  }
  for (let i = 0; i < input.length; i++) {
    for (let j = input.length; j > i; j--) {
      const substring = input.slice(i, j)
      if (target.includes(substring) && substring.length > target.length / 2) {
        // we only consider substrings that are at least half the length of the target

        matches.push({ start: i, end: j })
        i = j
        break
      }
    }
  }
  matches = matches.sort((a, b) => b.end - b.start - (a.end - a.start))
  return matches
}

export function sortByStr(flattendJobEntys: flattendJobEnty[], sortByString: sortByString, layout: TableLayout[]) {
    // Sorts strings by 1) the longest common substring and 2) the total length
      // amount of substrings matches in the columns.
      // Note: Not the whole substring must match, we consider 1/2 to be the minimum match

      // ensure that all columns are present
      const columns = layout
        .map((layout) => layout.key)
        .filter((col) => !sortByString.ignoreColumns.includes(col))
      const sortKey = sortByString.key

      // we create a sort map, to not loss track of the indeces after sorting
      // we try to not rely on any specific colum of flattendJobEnty, even if we know that the key is present
      const entriesSortMap: {
        job: flattendJobEnty
        highlights: Record<string, HighlightSubstring[]>
      }[] = flattendJobEntys.map((entry) => {
        const highlights: { [key: string]: HighlightSubstring[] } = {}
        columns.forEach((col) => {
          highlights[col] = longestCommonSubstring(
            String(entry[col]),
            sortKey,
            !sortByString.caseInsensitive,
          )
        })
        return { job: entry, highlights: highlights }
      })

      entriesSortMap.sort((a, b) => {
        let aScore: number[] = []
        let bScore: number[] = []
        // itterate over all columns and add the longest common substring length to the score
        columns.forEach((col) => {
          a.highlights[col].forEach((highlight) => {
            aScore.push(highlight.end - highlight.start)
          })
          b.highlights[col].forEach((highlight) => {
            bScore.push(highlight.end - highlight.start)
          })
        })

        // sort the scores in descending order
        // longest common substring is the best match
        aScore = aScore.sort((a, b) => b - a)
        bScore = bScore.sort((a, b) => b - a)
        let i = 0
        for (; i < aScore.length; i++) {
          if (aScore[i] !== bScore[i]) {
            return bScore[i] - aScore[i]
          }
        }

        // if the scores are equal, we sort by the total score
        return aScore.reduce((acc, val) => acc + val, 0) - bScore.reduce((acc, val) => acc + val, 0)
      })
      const highlightSubstring: Record<number, Record<string, HighlightSubstring[]>> = {}
      const contentRessult = entriesSortMap.map((entry, index) => {
        highlightSubstring[index] = entry.highlights
        return entry.job
      })
        return {
            content: contentRessult,
            highlightSubstring: highlightSubstring,
        }
  }