<header class="major-header">
  <h5 class="subheader"><?php print t('Category:'); ?></h5>
  <h4><?php print render($content['field_category']); ?></h4>
</header>
<ul class="medium-block-grid-2">
  <li>
    <article class="row">
      <div class="medium-6 columns">
        <h3 itemprop="headline"><?php print $title; ?></h3>
        <h5 class="subheader" itemprop="description"><?php print render($content['field_sub_title']); ?></h5>
        <p itemprop="text"><?php print render($content['body']); ?></p>
      </div>
      <div class="medium-6 columns">
        <figure>
          <?php print render($content['field_product_image']); ?>
        </figure>
      </div>
    </article>
    <div class="row">
      <div class="column">
        <hr>
      </div>
    </div>
  </li>
</ul>