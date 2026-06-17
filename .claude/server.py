import http.server, os
os.chdir('/Users/yijiepan/Documents/margin_dmg')
httpd = http.server.HTTPServer(('', 5175), http.server.SimpleHTTPRequestHandler)
httpd.serve_forever()
