import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('bay')
data = B.read('data.js')

extra = [B.read('sig2_bay.js')]
open(B.R+'bay-ledger.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'bay-ledger-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('bay-ledger.html')
