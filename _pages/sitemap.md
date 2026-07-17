---
layout: archive
title: "Sitemap"
permalink: /sitemap/
author_profile: false
published: false
---

{% include base_path %}

A concise index of the public pages and research content on this site. An [XML version]({{ base_path }}/sitemap.xml) is also available for search engines.

<h2>Pages</h2>
{% assign public_pages = site.pages | sort: "title" %}
{% for post in public_pages %}
  {% if post.title and post.sitemap != false and post.published != false %}
    {% include archive-single.html %}
  {% endif %}
{% endfor %}

{% for collection in site.collections %}
  {% unless collection.output == false or collection.label == "posts" %}
    {% assign public_documents = collection.docs | where_exp: "item", "item.sitemap != false" %}
    {% assign public_documents = public_documents | where_exp: "item", "item.published != false" %}
    {% if public_documents.size > 0 %}
      <h2>{{ collection.label | capitalize }}</h2>
      {% for post in public_documents %}
        {% include archive-single.html %}
      {% endfor %}
    {% endif %}
  {% endunless %}
{% endfor %}

{% assign public_posts = site.posts | where_exp: "item", "item.sitemap != false" %}
{% assign public_posts = public_posts | where_exp: "item", "item.published != false" %}
{% if public_posts.size > 0 %}
  <h2>Posts</h2>
  {% for post in public_posts %}
    {% include archive-single.html %}
  {% endfor %}
{% endif %}
