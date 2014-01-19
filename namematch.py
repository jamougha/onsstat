import psycopg2
from collections import defaultdict
import re
import mydb

words = re.compile(r'[ "#&\'()-,+/:;<>=?\.!"]')
def tokenize(s):
    s = s.upper()
    tokens = filter(lambda x: x, words.split(s))
    return tokens

class STree(object):
    """ A Suffix Tree. Initialize with an iterable containing (cdid, [token]) tuples.
    Takes a suffix and looks up all the cdids containing a token with that suffix.
    Returns two sets, one of exact matches ('foo' -> 'foo') and one of
    suffix matches ('foo' -> 'foobar').
    Used by the search functionality of the website.
    TODO: optimize this
    """
    def __init__(self, toks = None):
        self._children = defaultdict(STree)
        self._cdids = set()
        self._size = 0
        if toks:
            for cdid, tokens in toks:
                self._insert(cdid, tokens)

    def find(self, token):
        if not token:
            return (set(self._cdids), self._getall() - self._cdids)
        token = token.upper()
        if self._children.has_key(token[0]):
            return self._children[token[0]].find(token[1:])
        return (set(), set())

    def _getall(self):
        gachildren = [child._getall() for child in self._children.values()]
        return reduce(lambda x, y: x | y, gachildren, self._cdids)

    def _insert(self, cdid, tokens):
        for token in tokens:
            self._insone(cdid, token)
            self._size += 1

    def _insone(self, cdid, token):
        if not token:
            self._cdids.add(cdid)
        else:
            token = token.upper()
            self._children[token[0]]._insone(cdid, token[1:])

class TokenMatcher(object):
    """Singleton used by the the back-end for search functionality.
     Finds cdids matching the tokens given to match_tokens
    """
    def __init__(self):
        cdids = mydb.db_get('select cdid, name from cdids')
        self._cdid_names = {cdid:name for cdid, name in cdids}
        tokenized = [(cdid, tokenize(name))
                     for cdid, name in self._cdid_names.items()]
        self._suffixtree = STree(tokenized)

    def match_tokens(self, tokens):
        """Find cdids with names that match the tokens.
        All tokens must be matched. Exact matches are prioritized
        over suffix matches.
        TODO: write tests
        """
        if len(tokens) > 10:
            tokens = tokens[:10]
        if len(tokens) == 1 and tokens[0].upper() in self._cdid_names:
            return (token[0], self._cdid_names[token[0]])
        matches_by_token = [self._suffixtree.find(token) for token in tokens]
        matching_all = reduce(lambda x, y: x & y, [a | b for a, b in matches_by_token])
        exacts_matches = [a for a, _ in matches_by_token]
        matching_all = sorted(matching_all,
                         key=lambda x: (sum(1 for s in exacts_matches if x in s), x),
                         reverse=True)
        return [(m, self._cdid_names[m]) for m in matching_all]

_matcher = TokenMatcher()
def get_matcher():
    return _matcher