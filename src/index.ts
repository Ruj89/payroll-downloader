import configuration, { Configuration } from "./configuration";
import logger from "./logger";

/**
 * Main process
 */
async function main() {
    // Launch the configuration process
    Configuration.launch(logger);
    // Launch the downloader process
    // Launch the organizer process
    // Launch the storage process
}

main().then(() => {
    process.exit();
});