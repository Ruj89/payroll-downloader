import logger from "./logger";

async function main() {
    logger.info("Hello World");    
}

main().then(() => {
    process.exit();
});