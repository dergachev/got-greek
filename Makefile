LOCALHOST_URL_PREFIX="http://localhost:7000/assets"
PROD_URL_PREFIX="http://dergachev.github.io/got-greek/assets"
export CODE TITLE URL_PREFIX

localhost.html: index.html.sh
	bash index.html.sh GG7000 $(LOCALHOST_URL_PREFIX) | tee localhost.html

index.html: index.html.sh
	bash index.html.sh GG $(PROD_URL_PREFIX) | tee index.html

serve:
	echo "Serving on http://localhost:7000/index.html"
	python -mSimpleHTTPServer 7000

# brew install fswatch
watch:
	fswatch/fswatch assets/ 'make localhost.html'
