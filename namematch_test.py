import unittest

import namematch

class STreeTest(unittest.TestCase):
    def test_foobar(self):
        toks = [('a', ['foobar', 'baz']),
                ('b', ['foogaz', 'vomit']),
                ('c', ['quasido', 'vogon']),
                ('d', ['quasimodo', 'barista']),
                ('e', ['bazmodo'])]
        tree = namematch.STree(toks)
        self.assertTrue(tree.find('git') == (set(), set()))
        self.assertTrue(len(tree.find('vog')[0]) == 0)
        self.assertTrue(tree.find('foo')[1] == set(['a', 'b']))
        self.assertTrue(tree.find('FOO')[1] == set(['a', 'b']))
        self.assertTrue(tree.find('baz')[0] == set(['a']))
        self.assertTrue(tree.find('baz')[1] == set(['e']))
        self.assertTrue(tree.find('quAsi')[1] == set(['c', 'd']))
        self.assertTrue(tree.find('')[1] == set(['a', 'b', 'c', 'd', 'e']))

if __name__ == '__main__':
    unittest.main()