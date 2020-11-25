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
    .requiredOption("-i, --inputs <inputs...>", "specify the path of turtle files or folders containing ONLY turtle files")
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
                const slashedSource = source.endsWith('/') ? source : source + '/';
                for (const f of (await readdir(slashedSource))) {
                    if (!skip.includes(path.resolve(slashedSource + f))) {
                        writerPromises.push(writeData(slashedSource + f, writer));
                    }
                }
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

function writeData(source, writer) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(source, 'utf8')
            .pipe(new N3.StreamParser())
            .on('data', q => writer.addQuad(q))
            .on('finish', resolve);
    });
}

run();