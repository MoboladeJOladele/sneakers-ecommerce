module.exports = {
    plugins: () => [
        require("postcss-import-glob").default(),

        require("postcss-preset-env")({
            stage: 2,
        }),

        require("postcss-combine-media-query"),
    ]
};