---
title: building my own cli tool
date: 2026-05-21
tags: [cli, tooling, typescript, javascript]
excerpt: building wtf-code, a brutally honest code analyzer that roasts your code but still delivers real metrics.
---

# building my own cli tool

i've used a lot of developer tools in my time. linters, formatters, analyzers, you name it. they're all useful, but they all share one thing in common: they're too nice. they tell you "this could be improved" when what they really mean is "this code is a disaster and you should feel bad."

i wanted something different. something honest.

## the spark

it started when i was dealing with a legacy codebase. you know the type, thousands of lines, no comments, variables named data, data2, result, final_final.js. i ran every analyzer we had and they all gave me the same polite suggestions.

i wanted something to look me in the eye and say "this file has strong 'we'll refactor later' energy."

so i built it.

## building wtf-code

### the stack

i went with typescript because i wanted type safety. cli tools can get messy fast. for parsing, i used acorn, a javascript ast parser. no ai, no apis, just raw ast analysis.

the core modules:

- **analyzer.ts**: file and directory analysis
- **metrics.ts**: ast-based code metrics
- **complexity.ts**: nesting and complexity analysis
- **rating.ts**: code scoring from 0 to 10
- **blame.ts**: git blame parser
- **diff.ts**: git diff reader
- **humor.ts**: commentary and phrase pools
- **formatter.ts**: chalk-based terminal output

each module does one thing and does it well. i tried to keep the architecture clean because i knew if i didn't, the tool would roast its own code, and i couldn't have that.

### the hard parts

**variable name detection**: this was trickier than i expected. extracting variable names from the ast is easy, but determining if they're "vague" required building a whole heuristics system. i ended up creating a list of offender names like data, temp, stuff, thing, result, and variations of final.

**the humor**: generating funny commentary without ai was a challenge. i built phrase pools and templates that get selected based on code metrics. if a file has no comments and 400 lines, it gets the "pain" greentext. if it has 5 classes and 2 imports, it gets the "doing too much" joke.

**git integration**: parsing git blame and diffs required understanding the output formats. turns out git output is... not great to parse. had to handle a lot of edge cases.

## what i learned

building a cli tool is different from building web apps. you have to think about:

- **exit codes**: what does your tool return when things go wrong?
- **stdout vs stderr**: where does output go?
- **argument parsing**: commander saved me here
- **cross-platform compatibility**: windows paths are fun

## the result

```text
$ wtf project

  Project analysis
──────────────────────────────────────────────────

  Files analyzed: 42

  Largest file:
    server.js (910 lines)

  Code smells detected:
    • large files
    • vague variable names

  Developer commentary:

    this project has strong "we'll refactor later" energy.

──────────────────────────────────────────────────
```

exactly what i wanted.

## it's a meme project (but actually useful)

let's be clear: this started as a joke. i wanted to laugh at bad code instead of cry about it. the greentext format, the roasting, the brutally honest commentary, it's all meant to be funny first.

but here's the thing: behind the memes, it's still a real code analyzer. it counts lines, functions, classes. it detects complexity, nesting depth, code smells. it parses git blame and diffs. the --explain flag gives you a clean technical breakdown without the sarcasm.

so yeah, it's a meme project. but if you strip away the humor, you still get useful metrics. the comedy is just a wrapper around actual analysis.

and honestly? sometimes that's what you need. a tool that makes you laugh while also telling you that your 400-line file has "variable naming confidence level: zero."

## why no ai

a lot of tools are rushing to add "ai-powered" features. i get it, it's trendy. but i think there's value in deterministic, offline analysis. you don't need an api key. you don't need to send your code to some server. it's just you and the ast.

plus, real developer humor comes from pattern recognition, not language models. the phrase "this function works but nobody knows why" hits different when it's generated from actual code metrics.

## what's next

typescript better support is planned. right now it only analyzes javascript files, but the ast parsing foundation is there, just need to handle the type annotations.

i also want to add more humor pools. the community has been suggesting phrases and i love it.

## try it out

```bash
npm install -g wtf-code
```

then roast your worst file with:

```bash
wtf <file> --roast
```

sometimes you just need brutal honesty. and that's exactly what this tool delivers.

-- andrew
