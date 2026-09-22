import io, sys

# Post markdown is staged under content/blog/_enc with every double quote
# written as an at sign, because the transport that created these files escapes
# quotes and backslashes. No post contains a literal at sign, and this fails
# loudly if a staged file ever contains a quote or a backslash.
slug = sys.argv[1]
src = 'content/blog/_enc/' + slug + '.md'
dst = 'content/blog/' + slug + '.md'
text = io.open(src, encoding='utf-8').read()
assert chr(92) not in text, 'unexpected backslash in staged post ' + slug
assert chr(34) not in text, 'unexpected quote in staged post ' + slug
io.open(dst, 'w', encoding='utf-8').write(text.replace('@', chr(34)))
print('decoded', dst, len(text))
