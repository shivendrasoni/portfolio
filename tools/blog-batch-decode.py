import io, sys, glob

# Post markdown is staged under content/blog/_enc, split into parts because of a
# size limit on the transport that wrote them, with every double quote written
# as an at sign because that transport also escapes quotes and backslashes. No
# post contains a literal at sign, and this fails loudly if a staged part ever
# contains a quote or a backslash.
slug = sys.argv[1]
parts = sorted(glob.glob('content/blog/_enc/' + slug + '.*.md'))
assert parts, 'no staged parts for ' + slug
text = ''.join(io.open(p, encoding='utf-8').read() for p in parts)
assert chr(92) not in text, 'unexpected backslash in staged post ' + slug
assert chr(34) not in text, 'unexpected quote in staged post ' + slug
dst = 'content/blog/' + slug + '.md'
io.open(dst, 'w', encoding='utf-8').write(text.replace('@', chr(34)))
print('decoded', dst, 'from', len(parts), 'parts,', len(text), 'chars')
