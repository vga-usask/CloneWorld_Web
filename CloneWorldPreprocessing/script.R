#load librarys
requirePackages <- function(packageNames) {
    for (name in packageNames) {
        if (!require(name, character.only = TRUE)) {
            install.packages(name)
        }
    }
}
requirePackages(c("xml2", "rjson", "imager", "ggplot2", "ggthemes"))

#set the data file path here
print("Reading data files...")
systemFilePath <- paste(getwd(), "temp/JSONs/system.json", sep = "/")
clonesFilePath <- paste(getwd(), "temp/JSONs/clones.json", sep = "/")

#read the data file
systemInfo <- fromJSON(file = systemFilePath)
cloneList <- fromJSON(file = clonesFilePath)
for (i in 1:length(cloneList)) {
    cloneList[[i]]$x = as.numeric(cloneList[[i]]$x)
    cloneList[[i]]$y = as.numeric(cloneList[[i]]$y)
    cloneList[[i]]$sumChangeCount = as.numeric(cloneList[[i]]$sumChangeCount)
    cloneList[[i]]$finalRevision = as.numeric(cloneList[[i]]$finalRevision)
}

#generate the colors
importances <- sapply(cloneList, function(d) { as.numeric(d$sumChangeCount) })
z <- matrix(quantile(importances[importances != 0]), nrow = 1, ncol = 5)
maxImportance <- max(importances)
cloneList <- cloneList[order(sapply(cloneList, function(d) { as.integer(d$sumChangeCount) }), decreasing = FALSE)]
colors <- sapply(cloneList, function(d) {
    importance <- as.numeric(d$sumChangeCount)
    r <- 0
    if (importance > z[1, 1]) { r <- .3 }
    if (importance > z[1, 2]) { r <- .5 }
    if (importance > z[1, 3]) { r <- .7 }
    if (importance > z[1, 4]) { r <- .9 }
    if (importance > z[1, 5]) { r <- 1 }
    g <- 1
    b <- 1
    if (d$finalRevision < systemInfo$finalRevision) {
        r <- 0
        g <- 0
        b <- 0
    }
    rgb(r, g - r, b - r)
})

#??
df = data.frame()
temp <- lapply(cloneList, function(d) {
    importance <- as.numeric(d$sumChangeCount)
    r <- 0
    if (importance > z[1, 1]) { r <- .3 }
    if (importance > z[1, 2]) { r <- .5 }
    if (importance > z[1, 3]) { r <- .7 }
    if (importance > z[1, 4]) { r <- .9 }
    if (importance > z[1, 5]) { r <- 1 }
    g <- 1
    b <- 1
    if (d$finalRevision < systemInfo$finalRevision) {
        r <- 0
        g <- 0
        b <- 0
    }
    if (importance > z[1, 1]) {
        data.frame(x = d$x, y = d$y, z = 1:10 * importance, col = r)
    }
    else {
        data.frame(x = d$x, y = d$y, z = 1, col = r)
    }
})
df <- do.call(rbind, temp)

#set plots as functions
plotPlain <- function() {
    ggplot(df[-row(df)[df == 0],], aes(x = x, y = y)) +
    stat_density_2d(aes(fill = NULL), geom = "raster", contour = FALSE) +
    scale_fill_distiller(palette = "Spectral", direction = -1) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_y_continuous(expand = c(0, 0)) +
    theme(
    axis.title.x = element_blank(),
    axis.text.x = element_blank(),
    axis.ticks.x = element_blank(),
    axis.title.y = element_blank(),
    axis.text.y = element_blank(),
    axis.ticks.y = element_blank(),
    legend.position = 'none'
  ) + geom_point(data = df, aes(colour = col), size = 1, stroke = 1, alpha = 0.1) +
    scale_colour_gradient(low = "lightblue", high = "red") +
    theme(plot.margin = grid::unit(c(0, 0, -1, -1), "mm"))
}
plotContour <- function() {
    ggplot(df[-row(df)[df == 0],], aes(x = x, y = y)) +
    stat_density_2d(aes(fill = ..density..), geom = "raster", contour = FALSE) +
    scale_fill_distiller(palette = "Spectral", direction = -1) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_y_continuous(expand = c(0, 0)) +
    theme(
    axis.title.x = element_blank(),
    axis.text.x = element_blank(),
    axis.ticks.x = element_blank(),
    axis.title.y = element_blank(),
    axis.text.y = element_blank(),
    axis.ticks.y = element_blank(),
    legend.position = 'none'
  ) + geom_point(data = df, aes(colour = col), size = 1, stroke = 1, alpha = 0.1) +
    scale_colour_gradient(low = "lightblue", high = "red") +
    theme(plot.margin = grid::unit(c(0, 0, -1, -1), "mm"))
}

#test plots
#plot(sapply(cloneList, function(d) { d$x }), sapply(cloneList, function(d) { d$y }), col = colors, xaxt = 'n', xlab = '', yaxt = 'n', ylab = '', pch = 20, cex = 0.3)
#plotPlain()
#plotContour()

#create output paths
getPathWithWorkDirectory <- function(path) {
    paste(getwd(), path, sep = "/")
}
unlink(getPathWithWorkDirectory("temp/img"), recursive = TRUE)
dir.create(getPathWithWorkDirectory("temp/img"))
dir.create(getPathWithWorkDirectory("temp/img/full"))
dir.create(getPathWithWorkDirectory("temp/img/full/plain"))
dir.create(getPathWithWorkDirectory("temp/img/full/contour"))

#generate full plot images
basesize <- 512
layer <- 1
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/plain/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotPlain()
dev.off()
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/contour/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotContour()
dev.off()
layer <- 2
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/plain/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotPlain()
dev.off()
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/contour/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotContour()
dev.off()
layer <- 3
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/plain/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotPlain()
dev.off()
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/contour/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotContour()
dev.off()
layer <- 4
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/plain/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotPlain()
dev.off()
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/contour/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotContour()
dev.off()
layer <- 5
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/plain/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotPlain()
dev.off()
p <- paste(getPathWithWorkDirectory("temp/img/"), "full/contour/", layer, ".png", sep = "")
png(p, width = basesize * 2 ^ (layer - 1), height = basesize * 2 ^ (layer - 1))
plotContour()
dev.off()