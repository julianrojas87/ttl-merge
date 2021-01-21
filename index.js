#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import util from 'util';
import N3 from 'n3';
import Commander from 'commander';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const program = new Commander.Command();

program
    .version("0.1.0")
    .requiredOption("-i, --inputs <inputs...>", "specify the path of turtle files or folders containing turtle files")
    .option("-e, --except [exceptions...]", "set of files in input folders that won't be merged")
    .option("-p, --prefixes <prefixes>", "path to JSON file containing the prefixes to be applied, e.g., { \"ex\": \"http://example.org#\" }");

program.parse(process.argv);

async function run() {
    try {
        const prefixes = program.prefixes ? JSON.parse(await readFile(program.prefixes, 'utf-8')) : {};
        const skip = program.except ? program.except.map(e => path.resolve(e)) : [];
        const writer = new N3.Writer(process.stdout, { end: false, prefixes: prefixes });
        const writerPromises = [];

        for (const source of program.inputs) {
            if (fs.lstatSync(source).isDirectory()) {
                await processDirectory(source, skip, writer, writerPromises);
            } else {
                writerPromises.push(writeData(source, writer));
            }
        }

        await Promise.all(writerPromises);
        writer.end();
    } catch (err) {
        console.error(err);
    }
}

async function processDirectory(dirPath, skip, writer, writerPromises) {
    const slashedSource = dirPath.endsWith('/') ? dirPath : dirPath + '/';
    for (const foundPath of (await readdir(slashedSource))) {
        if (fs.lstatSync(slashedSource + foundPath).isDirectory()) {
            await processDirectory(slashedSource + foundPath, skip, writer, writerPromises)
        } else if (!skip.includes(path.resolve(slashedSource + foundPath))) {
            if (path.extname(foundPath) === '.ttl') {
                writerPromises.push(writeData(slashedSource + foundPath, writer));
            } else {
                console.error(`File ${slashedSource + foundPath} is skipped, because not a turtle file.`);
            }
        }
    }
}

function writeData(source, writer) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(source, 'utf8')
            .pipe(new N3.StreamParser({ baseIRI: source }))
            .on('data', q => writer.addQuad(q))
            .on('finish', resolve);
    });
}

run();
