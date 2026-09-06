import urllib.request
import json
req = urllib.request.Request('https://qml-solution.onrender.com/api/upload-xray', method='POST', headers={'Content-Type': 'multipart/form-data; boundary=boundary'}, data=b'--boundary\r\nContent-Disposition: form-data; name="file"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest\r\n--boundary--\r\n')
try:
    print(urllib.request.urlopen(req, timeout=120).read())
except Exception as e:
    print(e)
