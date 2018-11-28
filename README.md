## Municode Code of Ordinances dump

1. Edit file with your preferred municipality's `productId` (Charlottesville is 12078) and `jobId` (2018-04-30 revision is 318538).

2. `docker build -t municode .`

3. `docker run -v /path/to/repo/:/data municode`

4. Data outputs to `./out.html`, `./out.json`, and `./out.txt`