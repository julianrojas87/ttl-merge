# ttl-merge

A CLI to merge multiple turtle (RDF) files into one file.

## Install

```bash
npm install -g ttl-merge
```

## Use

Use `ttl-merge -h` to see the options:

```
Options:
  -V, --version                 output the version number
  -i, --inputs <inputs...>      specify the path of turtle files or folders containing ONLY turtle files
  -e, --except [exceptions...]  set of files in input folders that won't be merged
  -p, --prefixes <prefixes>     path to JSON file containing the prefixes to be applied, e.g., { "ex": "http://example.org#" }
  -h, --help                    display help for command
```

## Examples

- Merge 2 files using given prefixes:  

  ```bash
  ttl-merge -i file1.ttl file2.ttl -p path/to/prefixes/file.json > merged.ttl
  ```

- Merge all files in folder except one:

  ```bash
  ttl-merge -i /path/to/folder -e path/to/skipped/file.ttl > merged.ttl
  ```

  
