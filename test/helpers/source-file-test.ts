import test, { ExecutionContext, ImplementationResult } from "ava";
import { Program } from "typescript";
import { AnalyzerResult } from "../../src/analyze/types/analyzer-result";
import { analyzeGlobs } from "../../src/cli/analyze-globs";
import { stripTypescriptValues } from "../../src/util/strip-typescript-values";

export function testResult(
	testName: string,
	globs: string[],
	callback: (result: AnalyzerResult[], program: Program, t: ExecutionContext) => ImplementationResult
) {
	// Skip all snapshot tests (temporary)
	test.skip(testName, async t => {
		const { results, program } = await analyzeGlobs(globs, {
			discoverLibraryFiles: true
		});

		const nonEmptyResults = results.filter(result => result.componentDefinitions.length > 0);

		if (nonEmptyResults.length === 0) {
			t.fail("Didn't find any components");
		}

		const sortedResults = nonEmptyResults
			.sort((a, b) => (a.sourceFile.fileName < b.sourceFile.fileName ? -1 : 1))
			.map(result => ({
				...result,
				componentDefinitions: result.componentDefinitions.sort((a, b) => (a.tagName < b.tagName ? -1 : 1))
			}));

		callback(sortedResults, program, t);
	});
}

export function testResultSnapshot(globs: string[]) {
	testResult(`Snapshot Test: ${globs.map(glob => `"${glob}"`).join(", ")}`, globs, (result, program, t) => {
		t.snapshot(stripTypescriptValues(result, program.getTypeChecker()));
	});
}
