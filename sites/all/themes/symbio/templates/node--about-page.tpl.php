<article id="first-section" class="row" data-equalizer>
  <div class="columns medium-6 push-6 about-page second circles" data-equalizer-watch>
    <div class="text-blurb" data-sr="enter right wait 1s move 50px">
      <header class="major-header">
        <h2 itemprop="headline"><?php print render($content['field_about_first_section_title']); ?></h2>
      </header>
      <?php print render($content['field_about_first_section_text']); ?>
    </div>
  </div>
  <div class="columns medium-6 pull-6 first circles" data-equalizer-watch>
    <figure data-sr="enter left wait 1s move 50px">
      <?php print render($content['field_about_first_section_image']); ?>
    </figure>
    <div class="circles-bg"></div>
  </div>
</article>
<article id="second-section" class="row" data-equalizer>
  <div class="columns medium-6 about-page third circles" data-equalizer-watch>
    <div class="text-blurb" data-sr="enter left move 50px">
      <header class="major-header">
        <h2 itemprop="headline"><?php print render($content['field_about_second_section_title']); ?></h2>
      </header>
      <?php print render($content['field_about_second_section_text']); ?>
    </div>
  </div>
  <div class="columns medium-6 fourth circles" data-equalizer-watch>
    <figure data-sr="enter right move 50px">
      <?php print render($content['field_about_second_section_image']); ?>
    </figure>
    <div class="circles-bg"></div>
  </div>
</article>
<article id="third-section" class="row" data-equalizer>
  <div class="columns medium-6 push-6 about-page sixth circles" data-equalizer-watch>
    <div class="text-blurb" data-sr="enter right move 50px">
      <header class="major-header">
        <h2 itemprop="headline"><?php print render($content['field_about_third_section_title']); ?></h2>
      </header>
      <?php print render($content['field_about_third_section_text']); ?>
    </div>
  </div>
  <div class="columns medium-6 pull-6 fifth circles" data-equalizer-watch>
    <figure data-sr="enter left move 50px">
      <?php print render($content['field_about_third_section_image']); ?>
    </figure>
    <div class="circles-bg"></div>
  </div>
</article>
<?php if(isset($node) && $node->field_about_quote_section_text):?>
<article class="row" id="quote">
  <div class="column about-page">
    <div class="text-blurb text-center" data-sr="enter bottom">
      <span class="quote-title"><?php print $node->field_about_quote_section_title['und'][0]['value']; ?></span>
      <?php print $node->field_about_quote_section_text['und'][0]['value']; ?>
    </div>
  </div>
</article> 
<?php endif; ?>