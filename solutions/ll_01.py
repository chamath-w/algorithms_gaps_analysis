"""
LRU Cache
Category: Linked Lists
Difficulty: hard

Design a Least Recently Used (LRU) cache.

Implement a function that processes a list of operations on an LRU cache and returns the results of get operations.

Input:
  capacity: int - the cache capacity
  operations: list of [op, key] or [op, key, value]
    op='put': insert/update key-value pair
    op='get': return value or -1

Return: list of results for get operations only.

Example: capacity=2, operations=[['put',1,1],['put',2,2],['get',1],['put',3,3],['get',2]] -> [1,-1]

Expected Time Complexity: O(1) per get and put
Expected Space Complexity: O(capacity)
"""


def lru_cache(capacity: int, operations: list) -> list[int]:
    # Write your solution here
    pass
